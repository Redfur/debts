import { roundAmount } from "@/shared/lib/round-amount";
import { minimizeTransfers } from "@/shared/lib/settlement";
import type { Debt } from "../types";
import {
	type Bill,
	type BillDraft,
	type BillItem,
	type BillParticipant,
	type BillShares,
	type BillSplitMode,
	type BillStatus,
	type BillTransfer,
	type BillTransferGroup,
	type BillTransferGrouping,
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
function isInBillSplit(participant: BillParticipant, mode: BillSplitMode): boolean {
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

function itemPeople(item: BillItem): number {
	return item.refs.length + item.extraPeople;
}

function isValidItem(item: BillItem): boolean {
	return toCents(item.price) > 0 && itemPeople(item) > 0;
}

/** Итог «По чеку» в копейках — сумма цен позиций. */
export function computeItemsTotalCents(items: BillItem[]): number {
	return items.reduce((acc, item) => acc + Math.max(0, toCents(item.price)), 0);
}

function gcd(a: bigint, b: bigint): bigint {
	return b === 0n ? a : gcd(b, a % b);
}

/**
 * «По чеку»: точная доля каждого — Σ цена / на скольких — в дробях с общим знаменателем (НОК всех «на скольких»),
 * округление один раз на весь чек: пол каждой доли, затем копейки по наибольшему остатку,
 * при равенстве — по порядку участников, люди без имени последними.
 */
function computeItemShares(draft: BillDraft): BillShares {
	const refs = draft.participants.map((p) => p.ref);
	const items = draft.items.filter(isValidItem);
	const denominator = items.reduce((acc, item) => {
		const n = BigInt(itemPeople(item));
		return (acc / gcd(acc, n)) * n;
	}, 1n);
	// Последний элемент — люди без имени.
	const numerators = new Array<bigint>(refs.length + 1).fill(0n);
	for (const item of items) {
		const part = (BigInt(toCents(item.price)) * denominator) / BigInt(itemPeople(item));
		for (const ref of item.refs) {
			const index = refs.indexOf(ref);
			if (index >= 0) numerators[index] += part;
		}
		numerators[refs.length] += part * BigInt(item.extraPeople);
	}
	const cents = numerators.map((n) => Number(n / denominator));
	const total = items.reduce((acc, item) => acc + toCents(item.price), 0);
	const leftover = total - cents.reduce((acc, c) => acc + c, 0);
	const order = numerators
		.map((n, index) => ({ index, remainder: n % denominator }))
		.sort((a, b) => (a.remainder === b.remainder ? a.index - b.index : a.remainder > b.remainder ? -1 : 1));
	const roundedUp = new Set<number>();
	for (const { index } of order.slice(0, leftover)) {
		cents[index] += 1;
		roundedUp.add(index);
	}
	const othersCents = cents.pop() ?? 0;
	const inSplit = refs.map((ref) => items.some((item) => item.refs.includes(ref)));
	return {
		cents,
		inSplit,
		leftoverCents: leftover,
		othersCents,
		roundedUpRefs: refs.filter((_, index) => roundedUp.has(index)),
	};
}

/** Доли участников в копейках. */
export function computeBillShares(draft: BillDraft): BillShares {
	if (draft.splitMode === "items") return computeItemShares(draft);
	const inSplit = draft.participants.map((p) => isInBillSplit(p, draft.splitMode));
	if (draft.splitMode === "amounts") {
		return {
			cents: draft.participants.map((p) => toCents(p.shareInput)),
			inSplit,
			leftoverCents: 0,
			othersCents: 0,
			roundedUpRefs: [],
		};
	}
	const weights = draft.participants.map((p, i) => {
		if (!inSplit[i]) return 0;
		return draft.splitMode === "shares" ? (p.shareInput ?? 0) : 1;
	});
	const { cents, leftover } = distributeCents(toCents(draft.totalAmount), weights);
	return { cents, inSplit, leftoverCents: leftover, othersCents: 0, roundedUpRefs: [] };
}

/** «По чеку»: итог — сумма позиций, плательщик один, деление не сверяется (остаток — у людей без имени). */
function validateItemsBill(draft: BillDraft): BillValidation {
	const totalCents = computeItemsTotalCents(draft.items);
	const shares = computeItemShares(draft);
	const paidRemainingCents = totalCents - draft.participants.reduce((acc, p) => acc + toCents(p.paid), 0);
	const payers = draft.participants.filter((p) => toCents(p.paid) > 0).length;
	const active = draft.participants.filter((p, i) => toCents(p.paid) > 0 || shares.inSplit[i]).length;
	const invalidItems = draft.items.flatMap((item, index) => (isValidItem(item) ? [] : [index]));

	const errors: BillValidationError[] = [];
	if (totalCents <= 0) errors.push("amount_required");
	if (active < 2) errors.push("participants_min");
	if (totalCents > 0 && (paidRemainingCents !== 0 || payers !== 1)) errors.push("paid_mismatch");
	if (draft.items.some((item) => toCents(item.price) <= 0)) errors.push("item_price_required");
	if (draft.items.some((item) => itemPeople(item) <= 0)) errors.push("item_people_required");
	return { errors, paidRemainingCents, splitRemainingCents: 0, invalidItems };
}

export function validateBill(draft: BillDraft): BillValidation {
	if (draft.splitMode === "items") return validateItemsBill(draft);
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
	return { errors, paidRemainingCents, splitRemainingCents, invalidItems: [] };
}

/**
 * Баланс участника в копейках: заплатил минус доля. «По чеку» долю людей без имени собирает плательщик:
 * она вычитается из его баланса, и сумма балансов остаётся нулевой без виртуального участника.
 */
function computeBillBalances(draft: BillDraft): number[] {
	const { cents, othersCents } = computeBillShares(draft);
	return draft.participants.map((p, i) => {
		const paid = toCents(p.paid);
		return paid - cents[i] - (paid > 0 ? othersCents : 0);
	});
}

/** Минимальная схема переводов; `null`, пока оплачено или распределено не всё. */
export function computeBillTransfers(draft: BillDraft): BillTransfer[] | null {
	const { errors } = validateBill(draft);
	const blocking: BillValidationError[] = [
		"amount_required",
		"paid_mismatch",
		"split_mismatch",
		"item_price_required",
		"item_people_required",
	];
	if (errors.some((error) => blocking.includes(error))) return null;
	const balances = computeBillBalances(draft);
	return minimizeTransfers(draft.participants.map((p, i) => ({ id: p.ref, cents: balances[i] }))).map((t) => ({
		from: t.from,
		to: t.to,
		amount: fromCents(t.cents),
	}));
}

/** Группы «Кто кому переводит»: по отправителю или получателю; «Я» — первая группа, остальные — в порядке переводов. */
export function groupBillTransfers(transfers: BillTransfer[], by: BillTransferGrouping): BillTransferGroup[] {
	const groups: BillTransferGroup[] = [];
	for (const t of transfers) {
		const ref = by === "from" ? t.from : t.to;
		let group = groups.find((g) => g.ref === ref);
		if (!group) {
			group = { ref, transfers: [], total: 0 };
			groups.push(group);
		}
		group.transfers.push(t);
		group.total = fromCents(toCents(group.total) + toCents(t.amount));
	}
	return groups.sort((a, b) => Number(b.ref === ME_REF) - Number(a.ref === ME_REF));
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
