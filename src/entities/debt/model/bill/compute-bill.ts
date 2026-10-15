import { roundAmount } from "@/shared/lib/round-amount";
import { minimizeTransfers } from "@/shared/lib/settlement";
import type { Debt } from "../types";
import {
	type Bill,
	type BillDraft,
	type BillParticipant,
	type BillShares,
	type BillSplitMode,
	type BillStatus,
	type BillTransfer,
	type BillValidation,
	type BillValidationError,
	ME_REF,
	type MyBillDebt,
} from "./types";

export function toCents(amount: number | null | undefined): number {
	return amount ? Math.round(amount * 100) : 0;
}

export function fromCents(cents: number): number {
	return roundAmount(cents / 100);
}

/** Делит ли участник счёт: «Поровну» — по отметке, «Долями» и «Суммами» — по ненулевой доле. */
export function isInBillSplit(participant: BillParticipant, mode: BillSplitMode): boolean {
	if (mode === "equal") return participant.inSplit;
	return mode === "shares" ? (participant.shareInput ?? 0) > 0 : toCents(participant.shareInput) > 0;
}

/** Раздаёт `total` копеек пропорционально весам; остаток — по копейке первым по порядку. */
function distributeCents(total: number, weights: number[]): { cents: number[]; leftover: number } {
	const weightSum = weights.reduce((acc, w) => acc + w, 0);
	if (weightSum <= 0 || total <= 0) return { cents: weights.map(() => 0), leftover: 0 };
	const cents = weights.map((w) => Math.floor((total * w) / weightSum));
	let leftover = total - cents.reduce((acc, c) => acc + c, 0);
	const distributed = leftover;
	for (let i = 0; i < cents.length && leftover > 0; i++) {
		if (weights[i] > 0) {
			cents[i] += 1;
			leftover -= 1;
		}
	}
	return { cents, leftover: distributed };
}

/** Доли участников в копейках. */
export function computeBillShares(draft: BillDraft): BillShares {
	const inSplit = draft.participants.map((p) => isInBillSplit(p, draft.splitMode));
	if (draft.splitMode === "amounts") {
		return { cents: draft.participants.map((p) => toCents(p.shareInput)), inSplit, leftoverCents: 0 };
	}
	const weights = draft.participants.map((p, i) => {
		if (!inSplit[i]) return 0;
		return draft.splitMode === "shares" ? (p.shareInput ?? 0) : 1;
	});
	const { cents, leftover } = distributeCents(toCents(draft.totalAmount), weights);
	return { cents, inSplit, leftoverCents: leftover };
}

export function validateBill(draft: BillDraft): BillValidation {
	const totalCents = toCents(draft.totalAmount);
	const shares = computeBillShares(draft);
	const paidRemainingCents = totalCents - draft.participants.reduce((acc, p) => acc + toCents(p.paid), 0);
	const splitRemainingCents = totalCents - shares.cents.reduce((acc, c) => acc + c, 0);
	const active = draft.participants.filter((p, i) => toCents(p.paid) > 0 || shares.inSplit[i]).length;

	const errors: BillValidationError[] = [];
	if (totalCents <= 0) errors.push("amount_required");
	if (active < 2) errors.push("participants_min");
	if (totalCents > 0 && paidRemainingCents !== 0) errors.push("paid_mismatch");
	if (totalCents > 0 && splitRemainingCents !== 0) errors.push("split_mismatch");
	return { errors, paidRemainingCents, splitRemainingCents };
}

/** Баланс участника в копейках: заплатил минус доля. */
export function computeBillBalances(draft: BillDraft): number[] {
	const { cents } = computeBillShares(draft);
	return draft.participants.map((p, i) => toCents(p.paid) - cents[i]);
}

/** Минимальная схема переводов; `null`, пока оплачено или распределено не всё. */
export function computeBillTransfers(draft: BillDraft): BillTransfer[] | null {
	const { errors } = validateBill(draft);
	if (errors.includes("amount_required") || errors.includes("paid_mismatch") || errors.includes("split_mismatch")) {
		return null;
	}
	const balances = computeBillBalances(draft);
	return minimizeTransfers(draft.participants.map((p, i) => ({ id: p.ref, cents: balances[i] }))).map((t) => ({
		from: t.from,
		to: t.to,
		amount: fromCents(t.cents),
	}));
}

/** Переводы с «Я» → долги пользователя. */
export function computeMyBillDebts(transfers: BillTransfer[]): MyBillDebt[] {
	const debts: MyBillDebt[] = [];
	for (const t of transfers) {
		if (t.to === ME_REF && t.from !== ME_REF) {
			debts.push({ contactId: t.from, direction: "owed_to_me", amount: t.amount });
		} else if (t.from === ME_REF && t.to !== ME_REF) {
			debts.push({ contactId: t.to, direction: "i_owe", amount: t.amount });
		}
	}
	return debts;
}

/** Статус выводится: при долгах из счёта — по ним, иначе — по ручному закрытию. */
export function computeBillStatus(bill: Bill, billDebts: Debt[]): BillStatus {
	if (billDebts.length > 0) {
		const closed = billDebts.every((d) => d.status === "closed");
		const closedAt = closed
			? billDebts.reduce<string | null>((max, d) => (d.closedAt && (!max || d.closedAt > max) ? d.closedAt : max), null)
			: null;
		return { status: closed ? "closed" : "active", closedAt, hasMyDebts: true };
	}
	return {
		status: bill.manualClosedAt ? "closed" : "active",
		closedAt: bill.manualClosedAt,
		hasMyDebts: false,
	};
}

/** «Раскидать поровну»: остаток делится между всеми участниками деления, копейки — первым по порядку. */
export function spreadBillRemainder(draft: BillDraft): BillParticipant[] {
	const { splitRemainingCents } = validateBill(draft);
	if (draft.splitMode !== "amounts" || splitRemainingCents <= 0) return draft.participants;
	const { cents } = distributeCents(
		splitRemainingCents,
		draft.participants.map(() => 1),
	);
	return draft.participants.map((p, i) =>
		cents[i] > 0 ? { ...p, shareInput: fromCents(toCents(p.shareInput) + cents[i]) } : p,
	);
}

/** Плашка «моей части» счёта: сумма переводов мне и моих переводов (от возвратов не зависит). */
export function computeBillMyTotals(transfers: BillTransfer[]): { owedToMe: number; iOwe: number } {
	let owedToMeCents = 0;
	let iOweCents = 0;
	for (const t of transfers) {
		if (t.to === ME_REF) owedToMeCents += toCents(t.amount);
		if (t.from === ME_REF) iOweCents += toCents(t.amount);
	}
	return { owedToMe: fromCents(owedToMeCents), iOwe: fromCents(iOweCents) };
}
