import { useMemo, useState } from "react";
import {
	type Bill,
	type BillDraft,
	type BillInput,
	type BillSplitMode,
	computeBillShares,
	computeBillTransfers,
	fromCents,
	ME_REF,
	spreadBillRemainder,
	toCents,
	validateBill,
} from "@/entities/debt";
import type { CurrencyCode } from "@/shared/lib/storage";

export type PayerMode = "one" | "several";

/** Участник в форме: суммы — сырые строки поля `AmountInput` («1500.5»). */
type FormParticipant = {
	ref: string;
	paid: string;
	inSplit: boolean;
	shares: number;
	amount: string;
};

export type BillFormState = {
	amount: string;
	currency: CurrencyCode;
	title: string;
	participants: FormParticipant[];
	payerMode: PayerMode;
	payerRef: string;
	splitMode: BillSplitMode;
};

/** Предыдущие суммы «Суммами» для «Отменить» после «Раскидать поровну». */
type SpreadUndo = { amounts: Record<string, string>; remainder: number };

function newParticipant(ref: string): FormParticipant {
	return { ref, paid: "", inSplit: true, shares: 1, amount: "" };
}

function toRaw(value: number | null | undefined): string {
	return value ? String(value) : "";
}

function parseRaw(raw: string): number {
	const value = Number(raw);
	return Number.isFinite(value) ? value : 0;
}

export function createEmptyBillForm(): BillFormState {
	return {
		amount: "",
		currency: "RUB",
		title: "",
		participants: [newParticipant(ME_REF)],
		payerMode: "one",
		payerRef: ME_REF,
		splitMode: "equal",
	};
}

export function billToFormState(bill: Bill): BillFormState {
	const payers = bill.participants.filter((p) => p.paid > 0);
	const single = payers.length === 1 && toCents(payers[0].paid) === toCents(bill.totalAmount);
	return {
		amount: toRaw(bill.totalAmount),
		currency: bill.currency,
		title: bill.title ?? "",
		participants: bill.participants.map((p) => ({
			ref: p.ref,
			paid: toRaw(p.paid),
			inSplit: p.inSplit,
			shares: bill.splitMode === "shares" ? (p.shareInput ?? 0) : 1,
			amount: bill.splitMode === "amounts" ? toRaw(p.shareInput) : "",
		})),
		payerMode: single ? "one" : "several",
		payerRef: single ? payers[0].ref : ME_REF,
		splitMode: bill.splitMode,
	};
}

function toDraft(state: BillFormState): BillDraft {
	const totalAmount = parseRaw(state.amount);
	return {
		totalAmount,
		splitMode: state.splitMode,
		participants: state.participants.map((p) => ({
			ref: p.ref,
			paid: state.payerMode === "one" ? (p.ref === state.payerRef ? totalAmount : 0) : parseRaw(p.paid),
			inSplit: p.inSplit,
			shareInput: state.splitMode === "shares" ? p.shares : state.splitMode === "amounts" ? parseRaw(p.amount) : null,
		})),
	};
}

export function toBillInput(state: BillFormState): BillInput {
	return { ...toDraft(state), title: state.title, currency: state.currency };
}

/** Состояние формы счёта и производные: проверка, доли и «Кто кому переводит» пересчитываются на каждый ввод. */
export function useBillForm(initial: () => BillFormState) {
	const [state, setState] = useState(initial);
	const [spreadUndo, setSpreadUndo] = useState<SpreadUndo | null>(null);

	const draft = useMemo(() => toDraft(state), [state]);
	const validation = useMemo(() => validateBill(draft), [draft]);
	const shares = useMemo(() => computeBillShares(draft), [draft]);
	const transfers = useMemo(() => computeBillTransfers(draft), [draft]);

	const patch = (next: Partial<BillFormState>) => setState((s) => ({ ...s, ...next }));
	const updateParticipant = (ref: string, change: Partial<FormParticipant>) =>
		setState((s) => ({ ...s, participants: s.participants.map((p) => (p.ref === ref ? { ...p, ...change } : p)) }));

	return {
		state,
		draft,
		validation,
		shares,
		transfers,
		spreadUndo,
		setAmount: (amount: string) => patch({ amount }),
		setCurrency: (currency: CurrencyCode) => patch({ currency }),
		setTitle: (title: string) => patch({ title }),
		/** Контакты из выбора участников: прежние сохраняют место, новые — в конец; «Я» всегда первый. */
		setContacts: (contactIds: string[]) =>
			setState((s) => {
				const kept = s.participants.filter((p) => p.ref === ME_REF || contactIds.includes(p.ref));
				const added = contactIds.filter((id) => !kept.some((p) => p.ref === id)).map(newParticipant);
				const participants = [...kept, ...added];
				const payerRef = participants.some((p) => p.ref === s.payerRef) ? s.payerRef : ME_REF;
				return { ...s, participants, payerRef };
			}),
		removeParticipant: (ref: string) =>
			setState((s) => ({
				...s,
				participants: s.participants.filter((p) => p.ref !== ref),
				payerRef: s.payerRef === ref ? ME_REF : s.payerRef,
			})),
		setPayer: (payerRef: string) => patch({ payerRef, payerMode: "one" }),
		/** «Один» → «Несколько»: вся сумма уже записана выбранному плательщику. */
		setPayerMode: (payerMode: PayerMode) =>
			setState((s) => {
				if (payerMode === s.payerMode) return s;
				if (payerMode === "several") {
					return {
						...s,
						payerMode,
						participants: s.participants.map((p) => ({ ...p, paid: p.ref === s.payerRef ? s.amount : "" })),
					};
				}
				const top = [...s.participants].sort((a, b) => parseRaw(b.paid) - parseRaw(a.paid))[0];
				return { ...s, payerMode, payerRef: top && parseRaw(top.paid) > 0 ? top.ref : ME_REF };
			}),
		setPaid: (ref: string, paid: string) => updateParticipant(ref, { paid }),
		setSplitMode: (splitMode: BillSplitMode) => {
			setSpreadUndo(null);
			patch({ splitMode });
		},
		setInSplit: (ref: string, inSplit: boolean) => updateParticipant(ref, { inSplit }),
		setShares: (ref: string, value: number) => updateParticipant(ref, { shares: Math.max(0, value) }),
		setSplitAmount: (ref: string, amount: string) => {
			setSpreadUndo(null);
			updateParticipant(ref, { amount });
		},
		spreadRemainder: () => {
			const next = spreadBillRemainder(draft);
			setSpreadUndo({
				amounts: Object.fromEntries(state.participants.map((p) => [p.ref, p.amount])),
				remainder: fromCents(validation.splitRemainingCents),
			});
			setState((s) => ({
				...s,
				participants: s.participants.map((p, i) => ({ ...p, amount: toRaw(next[i]?.shareInput) })),
			}));
		},
		undoSpread: () => {
			if (!spreadUndo) return;
			setState((s) => ({
				...s,
				participants: s.participants.map((p) => ({ ...p, amount: spreadUndo.amounts[p.ref] ?? p.amount })),
			}));
			setSpreadUndo(null);
		},
	};
}

export type BillFormApi = ReturnType<typeof useBillForm>;
