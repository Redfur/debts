import type { PersistedContact, PersistedDebt, PersistedDebtOperation, PersistedMeta } from "./schema";

export interface StorageAdapter {
	getAllContacts(): Promise<PersistedContact[]>;
	putContact(contact: PersistedContact): Promise<void>;
	getAllDebts(): Promise<PersistedDebt[]>;
	putDebt(debt: PersistedDebt): Promise<void>;
	/** Удаляет долг и все его операции. */
	deleteDebt(id: string): Promise<void>;
	getAllDebtOperations(): Promise<PersistedDebtOperation[]>;
	putDebtOperation(operation: PersistedDebtOperation): Promise<void>;
	getMeta(): Promise<PersistedMeta>;
	setMeta(meta: PersistedMeta): Promise<void>;
}
