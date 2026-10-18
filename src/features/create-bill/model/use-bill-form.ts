import { useMemo, useState } from "react";
import {
	type Bill,
	type BillDraft,
	type BillInput,
	type BillItem,
	type BillSplitMode,
	computeBillShares,
	computeBillTransfers,
	computeItemsTotalCents,
	fromCents,
	MAX_EXTRA_PEOPLE,
	ME_REF,
	spreadBillRemainder,
	toCents,
	validateBill,
} from "@/entities/debt";
import { generateId } from "@/shared/lib/id";
import type { CurrencyCode } from "@/shared/lib/storage";

export type PayerMode = "one" | "several";

/** Как записывается счёт: итог одной суммой или по позициям чека. */
export type BillEntry = "sum" | "receipt";

/** Позиция в форме: цена — сырая строка `AmountInput`; отметки — в порядке участников. */
export type FormItem = {
	id: string;
	title: string;
	price: string;
	refs: string[];
	extraPeople: number;
};

/** Чего не хватает заполненной позиции; у пустой строки — ничего (она не сохраняется). */
export type ItemIssue = "price" | "people" | "both" | null;

/** Участник в форме: суммы — сырые строки поля `AmountInput` («1500.5»). */
type FormParticipant = {
	ref: string;
	paid: string;
	inSplit: boolean;
	shares: number;
	amount: string;
};

export type BillFormState = {
	entry: BillEntry;
	amount: string;
	currency: CurrencyCode;
	title: string;
	participants: FormParticipant[];
	payerMode: PayerMode;
	payerRef: string;
	/** Выбор «Как делим» для «Одной суммой»; сохраняется, пока открыт режим «По чеку». */
	splitMode: Exclude<BillSplitMode, "items">;
	items: FormItem[];
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

function newItem(): FormItem {
	return { id: generateId(), title: "", price: "", refs: [], extraPeople: 0 };
}

function itemPeople(item: FormItem): number {
	return item.refs.length + item.extraPeople;
}

/** Строка без названия, цены и людей — не позиция. */
function isEmptyItem(item: FormItem): boolean {
	return !item.title.trim() && toCents(parseRaw(item.price)) <= 0 && itemPeople(item) === 0;
}

export function itemIssue(item: FormItem): ItemIssue {
	if (isEmptyItem(item)) return null;
	const noPrice = toCents(parseRaw(item.price)) <= 0;
	const noPeople = itemPeople(item) === 0;
	if (noPrice && noPeople) return "both";
	return noPrice ? "price" : noPeople ? "people" : null;
}

function toBillItem(item: FormItem, refs: string[]): BillItem {
	return {
		id: item.id,
		title: item.title.trim() || null,
		price: parseRaw(item.price),
		refs: refs.filter((ref) => item.refs.includes(ref)),
		extraPeople: item.extraPeople,
	};
}

/** Отметки без участника, которого больше нет в счёте. */
function keepRefs(items: FormItem[], refs: string[]): FormItem[] {
	return items.map((item) =>
		item.refs.every((ref) => refs.includes(ref)) ? item : { ...item, refs: item.refs.filter((r) => refs.includes(r)) },
	);
}

export function createEmptyBillForm(): BillFormState {
	return {
		entry: "sum",
		amount: "",
		currency: "RUB",
		title: "",
		participants: [newParticipant(ME_REF)],
		payerMode: "one",
		payerRef: ME_REF,
		splitMode: "equal",
		items: [],
	};
}

export function billToFormState(bill: Bill): BillFormState {
	const payers = bill.participants.filter((p) => p.paid > 0);
	const single = payers.length === 1 && toCents(payers[0].paid) === toCents(bill.totalAmount);
	const receipt = bill.splitMode === "items";
	return {
		entry: receipt ? "receipt" : "sum",
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
		splitMode: bill.splitMode === "items" ? "equal" : bill.splitMode,
		items: bill.items.map((item) => ({
			id: item.id,
			title: item.title ?? "",
			price: toRaw(item.price),
			refs: item.refs,
			extraPeople: item.extraPeople,
		})),
	};
}

/** «По чеку»: итог — сумма заполненных позиций, всё у одного плательщика, `inSplit` — по отметкам. */
function toReceiptDraft(state: BillFormState): BillDraft {
	const refs = state.participants.map((p) => p.ref);
	const items = state.items.filter((item) => !isEmptyItem(item)).map((item) => toBillItem(item, refs));
	const totalAmount = fromCents(computeItemsTotalCents(items));
	return {
		totalAmount,
		splitMode: "items",
		participants: state.participants.map((p) => ({
			ref: p.ref,
			paid: p.ref === state.payerRef ? totalAmount : 0,
			inSplit: items.some((item) => item.refs.includes(p.ref)),
			shareInput: null,
		})),
		items,
	};
}

function toDraft(state: BillFormState): BillDraft {
	if (state.entry === "receipt") return toReceiptDraft(state);
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
		items: [],
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
	const updateItem = (id: string, change: (item: FormItem) => Partial<FormItem>) =>
		setState((s) => ({ ...s, items: s.items.map((item) => (item.id === id ? { ...item, ...change(item) } : item)) }));
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
				return {
					...s,
					participants,
					payerRef,
					items: keepRefs(
						s.items,
						participants.map((p) => p.ref),
					),
				};
			}),
		removeParticipant: (ref: string) =>
			setState((s) => {
				const participants = s.participants.filter((p) => p.ref !== ref);
				return {
					...s,
					participants,
					payerRef: s.payerRef === ref ? ME_REF : s.payerRef,
					items: keepRefs(
						s.items,
						participants.map((p) => p.ref),
					),
				};
			}),
		/**
		 * «Одной суммой» ↔ «По чеку». В чек — один плательщик (при «Несколько» — с наибольшей оплатой) и пустая строка,
		 * если позиций нет; обратно — пустая сумма заполняется итогом позиций.
		 */
		setEntry: (entry: BillEntry) =>
			setState((s) => {
				if (entry === s.entry) return s;
				if (entry === "receipt") {
					const top = [...s.participants].sort((a, b) => parseRaw(b.paid) - parseRaw(a.paid))[0];
					const payerRef = s.payerMode === "several" ? (top && parseRaw(top.paid) > 0 ? top.ref : ME_REF) : s.payerRef;
					return { ...s, entry, payerMode: "one", payerRef, items: s.items.length > 0 ? s.items : [newItem()] };
				}
				const itemsCents = computeItemsTotalCents(toReceiptDraft(s).items);
				const amount = toCents(parseRaw(s.amount)) <= 0 && itemsCents > 0 ? toRaw(fromCents(itemsCents)) : s.amount;
				return { ...s, entry, amount };
			}),
		addItem: () => setState((s) => ({ ...s, items: [...s.items, newItem()] })),
		removeItem: (id: string) => setState((s) => ({ ...s, items: s.items.filter((item) => item.id !== id) })),
		setItemTitle: (id: string, title: string) => updateItem(id, () => ({ title })),
		setItemPrice: (id: string, price: string) => updateItem(id, () => ({ price })),
		/** Отметка «делит позицию»; порядок отметок — как у участников. */
		toggleItemRef: (id: string, ref: string) =>
			setState((s) => ({
				...s,
				items: s.items.map((item) => {
					if (item.id !== id) return item;
					const on = !item.refs.includes(ref);
					const refs = s.participants.map((p) => p.ref).filter((r) => (r === ref ? on : item.refs.includes(r)));
					return { ...item, refs };
				}),
			})),
		setItemExtraPeople: (id: string, extraPeople: number) =>
			updateItem(id, () => ({ extraPeople: Math.min(MAX_EXTRA_PEOPLE, Math.max(0, extraPeople)) })),
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
		setSplitMode: (splitMode: Exclude<BillSplitMode, "items">) => {
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
