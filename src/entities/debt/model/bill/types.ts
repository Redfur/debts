import type { BillParticipant, BillSplitMode, DebtDirection, PersistedBill } from "@/shared/lib/storage";

export type { BillParticipant };

export type Bill = PersistedBill;
export type { BillSplitMode };

/** `ref` участника-пользователя. */
export const ME_REF = "me";

/** То, что определяет расчёт счёта; общий вход для формы и сохранённого счёта. */
export type BillDraft = Pick<Bill, "totalAmount" | "splitMode" | "participants">;

export type BillShares = {
	/** Доля каждого участника в копейках, в порядке `participants`. */
	cents: number[];
	/** Участник делит счёт. */
	inSplit: boolean[];
	/** Неделимые копейки, розданные первым участникам деления (только «Поровну» и «Долями»). */
	leftoverCents: number;
};

export type BillTransfer = {
	/** `ref` участника. */
	from: string;
	to: string;
	amount: number;
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

export type BillValidationError = "amount_required" | "participants_min" | "paid_mismatch" | "split_mismatch";

export type BillValidation = {
	errors: BillValidationError[];
	/** Сумма минус оплачено, в копейках (> 0 — не оплачено, < 0 — переплачено). */
	paidRemainingCents: number;
	/** Сумма минус распределено, в копейках (> 0 — осталось распределить, < 0 — распределено больше). */
	splitRemainingCents: number;
};
