import type {
	CreationDraft,
	CreationDraftKind,
	PersistedBill,
	PersistedContact,
	PersistedContactSettlement,
	PersistedDebt,
	PersistedDebtOperation,
	PersistedMeta,
} from "./schema";

type ContactSettlementWrite = {
	settlement: PersistedContactSettlement;
	debts: PersistedDebt[];
	operations: PersistedDebtOperation[];
};

type StoredData = {
	contacts: PersistedContact[];
	debts: PersistedDebt[];
	debtOperations: PersistedDebtOperation[];
	bills: PersistedBill[];
	contactSettlements: PersistedContactSettlement[];
	meta: PersistedMeta;
};

export interface StorageAdapter {
	getCreationDraft(kind: CreationDraftKind): Promise<unknown>;
	putCreationDraft(draft: CreationDraft): Promise<void>;
	deleteCreationDraft(kind: CreationDraftKind, expectedId: string | undefined): Promise<void>;
	putDebtWithOperation(debt: PersistedDebt, operation: PersistedDebtOperation, draftId?: string): Promise<void>;
	getAllContacts(): Promise<PersistedContact[]>;
	putContact(contact: PersistedContact): Promise<void>;
	getAllDebts(): Promise<PersistedDebt[]>;
	updateDebt(debt: PersistedDebt, previous: PersistedDebt, operation?: PersistedDebtOperation): Promise<void>;
	/** Удаляет долг и все его операции. */
	deleteDebt(id: string): Promise<string[]>;
	getAllBills(): Promise<PersistedBill[]>;
	/** Одной транзакцией: записывает счёт, удаляет долги `deleteDebtIds` с их операциями, записывает долги и операции. */
	putBillWithDebts(
		bill: PersistedBill,
		upsertDebts: PersistedDebt[],
		upsertOperations: PersistedDebtOperation[],
		deleteDebtIds: string[],
		draftId?: string,
		expected?: { bill: PersistedBill; debts: PersistedDebt[] },
	): Promise<void>;
	/** Одной транзакцией удаляет счёт, его долги и их операции. */
	deleteBillCascade(billId: string): Promise<string[]>;
	getAllDebtOperations(): Promise<PersistedDebtOperation[]>;
	getAllContactSettlements(): Promise<PersistedContactSettlement[]>;
	commitContactSettlement(
		contactId: string,
		prepare: (debts: PersistedDebt[], operations: PersistedDebtOperation[]) => ContactSettlementWrite | null,
	): Promise<ContactSettlementWrite | null>;
	getMeta(): Promise<PersistedMeta>;
	setMeta(meta: PersistedMeta): Promise<void>;
	readAll(): Promise<StoredData>;
	/** Атомарно заменяет все данные: при ошибке прежние данные остаются нетронутыми. */
	replaceAll(data: StoredData): Promise<void>;
}
