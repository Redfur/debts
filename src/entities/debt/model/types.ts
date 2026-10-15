import type { PersistedContact, PersistedDebt, PersistedDebtOperation } from "@/shared/lib/storage";

/** Контакт-должник/кредитор; совпадает с формой в IndexedDB. */
export type Contact = PersistedContact;

export type Debt = PersistedDebt;

export type DebtOperation = PersistedDebtOperation;

export type ContactSummary = {
	/** Сколько контакт должен пользователю, по валютам активных долгов. */
	owedToMeByCurrency: Partial<Record<Debt["currency"], number>>;
	/** Сколько пользователь должен контакту, по валютам активных долгов. */
	owedByMeByCurrency: Partial<Record<Debt["currency"], number>>;
};

export type GlobalTotals = {
	/** Сумма всех «мне должны» в валюте отображения; null — не удалось сконвертировать (нет курса). */
	totalOwedToMeConverted: number | null;
	/** Сумма всех «я должен» в валюте отображения; null — не удалось сконвертировать (нет курса). */
	totalOwedByMeConverted: number | null;
	owedToMeByCurrency: Partial<Record<Debt["currency"], number>>;
	owedByMeByCurrency: Partial<Record<Debt["currency"], number>>;
};

/** Остаток одного направления: в валюте итогов (`null` — нет курса) и по исходным валютам. */
export type DirectionTotal = {
	converted: number | null;
	byCurrency: Partial<Record<Debt["currency"], number>>;
};

export type ContactTotals = {
	owedToMe: DirectionTotal;
	owedByMe: DirectionTotal;
	/** Есть хотя бы один активный долг. */
	hasActive: boolean;
	/** Есть хотя бы один погашенный долг. */
	hasClosed: boolean;
};

export type NetPosition = {
	kind: "owed-to-me" | "i-owe" | "balanced" | "none";
	/** Разница по модулю в валюте итогов. */
	diff: number;
};

/** Вкладка фильтра на главной. */
export type ContactDirectionFilter = "all" | "owed-to-me" | "i-owe";
