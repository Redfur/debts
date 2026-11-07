import type {
	CreationDraft,
	CreationDraftKind,
	PersistedBill,
	PersistedContact,
	PersistedDebt,
	PersistedDebtOperation,
	PersistedMeta,
} from "./schema";

export interface StorageAdapter {
	getCreationDraft(kind: CreationDraftKind): Promise<unknown>;
	putCreationDraft(draft: CreationDraft): Promise<void>;
	deleteCreationDraft(kind: CreationDraftKind, expectedId: string | undefined): Promise<void>;
	putDebtWithOperation(debt: PersistedDebt, operation: PersistedDebtOperation, draftId?: string): Promise<void>;
	getAllContacts(): Promise<PersistedContact[]>;
	putContact(contact: PersistedContact): Promise<void>;
	getAllDebts(): Promise<PersistedDebt[]>;
	putDebt(debt: PersistedDebt): Promise<void>;
	/** Удаляет долг и все его операции. */
	deleteDebt(id: string): Promise<void>;
	getAllBills(): Promise<PersistedBill[]>;
	/** Одной транзакцией: записывает счёт, удаляет долги `deleteDebtIds` с их операциями, записывает долги и операции. */
	putBillWithDebts(
		bill: PersistedBill,
		upsertDebts: PersistedDebt[],
		upsertOperations: PersistedDebtOperation[],
		deleteDebtIds: string[],
		draftId?: string,
	): Promise<void>;
	/** Одной транзакцией удаляет счёт, его долги и их операции. */
	deleteBillCascade(billId: string): Promise<void>;
	getAllDebtOperations(): Promise<PersistedDebtOperation[]>;
	putDebtOperation(operation: PersistedDebtOperation): Promise<void>;
	getMeta(): Promise<PersistedMeta>;
	setMeta(meta: PersistedMeta): Promise<void>;
	/** Атомарно заменяет все данные: при ошибке прежние данные остаются нетронутыми. */
	replaceAll(data: {
		contacts: PersistedContact[];
		debts: PersistedDebt[];
		debtOperations: PersistedDebtOperation[];
		bills: PersistedBill[];
		meta: PersistedMeta;
	}): Promise<void>;
}
