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
