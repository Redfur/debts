import type { BillItem, BillParticipant, BillSplitMode, DebtDirection, PersistedBill } from "@/shared/lib/storage";

export type { BillItem, BillParticipant };

export type Bill = PersistedBill;
export type { BillSplitMode };

/** `ref` участника-пользователя. */
export const ME_REF = "me";

/** Больше людей без имени в одной позиции не бывает. */
export const MAX_EXTRA_PEOPLE = 99;

/** То, что определяет расчёт счёта; общий вход для формы и сохранённого счёта. */
export type BillDraft = Pick<Bill, "totalAmount" | "splitMode" | "participants" | "items">;

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
	| "item_people_required";

export type BillValidation = {
	errors: BillValidationError[];
	/** Сумма минус оплачено, в копейках (> 0 — не оплачено, < 0 — переплачено). */
	paidRemainingCents: number;
	/** Сумма минус распределено, в копейках (> 0 — осталось распределить, < 0 — распределено больше). */
	splitRemainingCents: number;
	/** «По чеку»: индексы позиций без цены или без людей. */
	invalidItems: number[];
};
