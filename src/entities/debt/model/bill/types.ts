import type {
	BillAdjustmentUnit,
	BillDiscount,
	BillItem,
	BillParticipant,
	BillSplitMode,
	BillTips,
	DebtDirection,
	PersistedBill,
} from "@/shared/lib/storage";

export type { BillAdjustmentUnit, BillDiscount, BillItem, BillParticipant, BillTips };

export type Bill = PersistedBill;
export type { BillSplitMode };

/** `ref` участника-пользователя. */
export const ME_REF = "me";

/** Больше людей без имени в одной позиции не бывает. */
export const MAX_EXTRA_PEOPLE = 99;

/** То, что определяет расчёт счёта; общий вход для формы и сохранённого счёта. */
export type BillDraft = Pick<Bill, "totalAmount" | "splitMode" | "participants" | "items" | "discount" | "tips">;

/** «По чеку» в копейках: позиции, применённые скидка и чаевые (с ошибкой — 0) и итог. */
export type ReceiptCents = {
	itemsCents: number;
	discountCents: number;
	tipsCents: number;
	totalCents: number;
};

/** Что не так со скидкой: не больше нуля, 100 % и больше, не меньше суммы позиций. */
export type DiscountIssue = "zero" | "percent_max" | "over_items" | null;

/** Что не так с чаевыми: не больше нуля, больше 100 %, никто не делит. */
export type TipsIssue = "zero" | "percent_max" | "people" | null;

export type BillShares = {
	/** Доля каждого участника в копейках, в порядке `participants`. */
	cents: number[];
	/** Участник делит счёт. */
	inSplit: boolean[];
	/** Неделимые копейки, розданные участникам деления (кроме «Суммами»). */
	leftoverCents: number;
	/** «По чеку»: доля людей без имени в копейках; у остальных способов — 0. */
	othersCents: number;
	/** «По чеку»: участники, получившие неделимую копейку, в порядке `participants`. */
	roundedUpRefs: string[];
	/** «По чеку»: неделимую копейку получили и люди без имени. */
	othersRoundedUp: boolean;
};

export type BillTransfer = {
	/** `ref` участника. */
	from: string;
	to: string;
	amount: number;
};

/** Как группировать «Кто кому переводит»: по отправителю или по получателю. */
export type BillTransferGrouping = "from" | "to";

export type BillTransferGroup = {
	/** `ref` отправителя или получателя — общий для переводов группы. */
	ref: string;
	transfers: BillTransfer[];
	total: number;
};

/** Долг пользователя, который даёт перевод с «Я». */
export type MyBillDebt = {
	contactId: string;
	direction: DebtDirection;
	amount: number;
};

export type BillStatus = {
	status: "active" | "closed";
	/** Когда счёт закрылся (последнее погашение или ручное закрытие). */
	closedAt: string | null;
	/** Есть долги пользователя из этого счёта: статус следует за ними, вручную не меняется. */
	hasMyDebts: boolean;
};

export type BillValidationError =
	| "amount_required"
	| "participants_min"
	| "paid_mismatch"
	| "split_mismatch"
	| "item_price_required"
	| "item_people_required"
	| "discount_invalid"
	| "tips_invalid";

export type BillValidation = {
	errors: BillValidationError[];
	/** Сумма минус оплачено, в копейках (> 0 — не оплачено, < 0 — переплачено). */
	paidRemainingCents: number;
	/** Сумма минус распределено, в копейках (> 0 — осталось распределить, < 0 — распределено больше). */
	splitRemainingCents: number;
	/** «По чеку»: индексы позиций без цены или без людей. */
	invalidItems: number[];
};
