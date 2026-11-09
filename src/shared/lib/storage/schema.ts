/** Форма записи в IndexedDB (доменные имена — в entities/debt). Слой shared не импортирует entities. */

import type { CurrencyCode } from "../../config/currency-catalog";

export type { CurrencyCode } from "../../config/currency-catalog";

export type PersistedContact = {
	id: string;
	name: string;
	/** Цвет аватара-инициала; детерминирован по имени при создании. */
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
	/** Счёт, из которого создан долг; `null` — обычный долг. */
	billId: string | null;
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

export type BillSplitMode = "equal" | "shares" | "amounts" | "items";

export type BillParticipant = {
	/** `"me"` — пользователь, иначе id контакта. */
	ref: string;
	/** Сколько участник заплатил. */
	paid: number;
	/** Участвует в делении («делит счёт»). */
	inSplit: boolean;
	/** Число долей (`shares`) или сумма доли (`amounts`); для `equal` и `items` — `null`. */
	shareInput: number | null;
};

/** Позиция чека (`splitMode: "items"`): делится поровну между отмеченными и людьми без имени. */
export type BillItem = {
	id: string;
	title: string | null;
	/** Цена за всю строку. */
	price: number;
	/** Отмеченные участники (`ref`), в порядке `participants`. */
	refs: string[];
	/** Люди без имени, 0…99: входят в деление, но не становятся участниками. */
	extraPeople: number;
};

/** Скидка или чаевые чека: процент или сумма в валюте счёта. */
export type BillAdjustmentUnit = "percent" | "amount";

/** Скидка на весь чек: уменьшает позиции пропорционально цене. Хранится введённое значение, деньги выводятся. */
export type BillDiscount = {
	unit: BillAdjustmentUnit;
	/** Процент (0…100, до двух знаков) или сумма. */
	value: number;
};

/** Чаевые чека: процент — от суммы позиций после скидки; делятся поровну между отмеченными и людьми без имени. */
export type BillTips = {
	unit: BillAdjustmentUnit;
	/** Процент (до 100) или сумма. */
	value: number;
	/** Отмеченные участники (`ref`), в порядке `participants`. */
	refs: string[];
	/** Люди без имени, 0…99. */
	extraPeople: number;
};

export type PersistedBill = {
	id: string;
	title: string | null;
	currency: CurrencyCode;
	totalAmount: number;
	splitMode: BillSplitMode;
	/** Порядок важен: задаёт раздачу неделимых копеек и порядок переводов. */
	participants: BillParticipant[];
	/** Позиции чека; `[]` у остальных способов деления. */
	items: BillItem[];
	/** Скидка на весь чек; `null` без скидки и у остальных способов деления. */
	discount: BillDiscount | null;
	/** Чаевые; `null` без чаевых и у остальных способов деления. */
	tips: BillTips | null;
	/** Ручное закрытие — только у счёта без моих переводов. */
	manualClosedAt: string | null;
	createdAt: string;
	updatedAt: string;
};

/** Курсы к одной базовой валюте (см. `shared/lib/exchange-rate`); обновляется не чаще раза в день. */
export type ExchangeRatesCache = {
	base: CurrencyCode;
	/** Дата курса от источника (YYYY-MM-DD). */
	date: string;
	/** Момент локального сохранения — для троттлинга обновления. */
	fetchedAt: string;
	rates: Partial<Record<CurrencyCode, number>>;
};

export type PersistedMeta = {
	schemaVersion: number;
	ratesCache: ExchangeRatesCache | null;
};

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

/** Скидка или чаевые в форме: значение — сырая строка `AmountInput`; пустое — их нет. */
export type FormAdjustment = {
	open: boolean;
	unit: BillAdjustmentUnit;
	value: string;
};

/** Чаевые в форме: отметки — в порядке участников. */
export type FormTips = FormAdjustment & {
	refs: string[];
	extraPeople: number;
};

/** Участник в форме: суммы — сырые строки поля `AmountInput` («1500.5»). */
export type FormParticipant = {
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
	discount: FormAdjustment;
	tips: FormTips;
};

export type DebtCreationFields = {
	contactId: string | undefined;
	direction: DebtDirection;
	currency: CurrencyCode;
	amount: string;
	note: string;
};
export type CreationDraftPayloads = {
	debt: DebtCreationFields;
	bill: BillFormState & { step: 1 | 2 };
};
export type CreationDraftKind = keyof CreationDraftPayloads;
export type CreationDraft<K extends CreationDraftKind = CreationDraftKind> = {
	[P in K]: { kind: P; id: string; version: 1; updatedAt: string; payload: CreationDraftPayloads[P] };
}[K];
