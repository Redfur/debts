/** Форма записи в IndexedDB (доменные имена — в entities/debt). Слой shared не импортирует entities. */

export type CurrencyCode = "RUB" | "USD" | "EUR" | "CNY";

export type PersistedContact = {
	id: string;
	name: string;
	/** Цвет аватара-инициала; детерминирован по `id` при создании. */
	colorValue: string;
	createdAt: string;
	updatedAt: string;
	archivedAt: string | null;
};

export type DebtDirection = "i_owe" | "owed_to_me";
type DebtStatus = "active" | "closed";

export type PersistedDebt = {
	id: string;
	contactId: string;
	direction: DebtDirection;
	currency: CurrencyCode;
	/** Исходная сумма долга; текущий остаток = principalAmount − сумма repayment-операций. */
	principalAmount: number;
	note: string | null;
	status: DebtStatus;
	createdAt: string;
	updatedAt: string;
	closedAt: string | null;
};

type DebtOperationKind = "initial" | "repayment";

export type PersistedDebtOperation = {
	id: string;
	debtId: string;
	kind: DebtOperationKind;
	amount: number;
	note: string | null;
	createdAt: string;
};

/** Курсы к одной базовой валюте (см. `shared/lib/exchange-rate`); обновляется не чаще раза в день. */
export type ExchangeRatesCache = {
	base: CurrencyCode;
	/** Дата курса от источника (YYYY-MM-DD). */
	date: string;
	/** Момент локального сохранения — для троттлинга обновления. */
	fetchedAt: string;
	rates: Record<CurrencyCode, number>;
};

export type PersistedMeta = {
	schemaVersion: number;
	ratesCache: ExchangeRatesCache | null;
};
