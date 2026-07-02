import { type DBSchema, deleteDB, type IDBPDatabase, openDB } from "idb";
import type { StorageAdapter } from "./contract";
import type { PersistedContact, PersistedDebt, PersistedDebtOperation, PersistedMeta } from "./schema";

const DB_NAME = "debts";
const DB_VERSION = 1;
const CURRENT_SCHEMA_VERSION = 1;

type MetaRow = PersistedMeta & { key: string };

interface DebtsDBSchema extends DBSchema {
	contacts: {
		key: string;
		value: PersistedContact;
	};
	debts: {
		key: string;
		value: PersistedDebt;
		indexes: { "by-contactId": string };
	};
	debtOperations: {
		key: string;
		value: PersistedDebtOperation;
		indexes: { "by-debtId": string };
	};
	meta: {
		key: string;
		value: MetaRow;
	};
}

let dbPromise: Promise<IDBPDatabase<DebtsDBSchema>> | null = null;

function getDb(): Promise<IDBPDatabase<DebtsDBSchema>> {
	if (!dbPromise) {
		dbPromise = openDB<DebtsDBSchema>(DB_NAME, DB_VERSION, {
			upgrade(database) {
				if (!database.objectStoreNames.contains("contacts")) {
					database.createObjectStore("contacts", { keyPath: "id" });
				}
				if (!database.objectStoreNames.contains("debts")) {
					const debtsStore = database.createObjectStore("debts", { keyPath: "id" });
					debtsStore.createIndex("by-contactId", "contactId");
				}
				if (!database.objectStoreNames.contains("debtOperations")) {
					const operationsStore = database.createObjectStore("debtOperations", { keyPath: "id" });
					operationsStore.createIndex("by-debtId", "debtId");
				}
				if (!database.objectStoreNames.contains("meta")) {
					database.createObjectStore("meta", { keyPath: "key" });
				}
			},
		});
	}
	return dbPromise;
}

const META_KEY = "app";

function createIndexedDbStorageAdapter(): StorageAdapter {
	return {
		async getAllContacts() {
			const db = await getDb();
			return db.getAll("contacts");
		},

		async putContact(contact: PersistedContact) {
			const db = await getDb();
			await db.put("contacts", contact);
		},

		async getAllDebts() {
			const db = await getDb();
			return db.getAll("debts");
		},

		async putDebt(debt: PersistedDebt) {
			const db = await getDb();
			await db.put("debts", debt);
		},

		async deleteDebt(id: string) {
			const db = await getDb();
			const tx = db.transaction(["debts", "debtOperations"], "readwrite");
			const operationsStore = tx.objectStore("debtOperations");
			const operationsIndex = operationsStore.index("by-debtId");
			const operations = await operationsIndex.getAllKeys(id);
			for (const operationId of operations) {
				await operationsStore.delete(operationId);
			}
			await tx.objectStore("debts").delete(id);
			await tx.done;
		},

		async getAllDebtOperations() {
			const db = await getDb();
			return db.getAll("debtOperations");
		},

		async putDebtOperation(operation: PersistedDebtOperation) {
			const db = await getDb();
			await db.put("debtOperations", operation);
		},

		async getMeta() {
			const db = await getDb();
			const row = await db.get("meta", META_KEY);
			return row
				? { schemaVersion: row.schemaVersion, ratesCache: row.ratesCache }
				: { schemaVersion: CURRENT_SCHEMA_VERSION, ratesCache: null };
		},

		async setMeta(meta: PersistedMeta) {
			const db = await getDb();
			await db.put("meta", { key: META_KEY, ...meta });
		},
	};
}

let singleton: StorageAdapter | null = null;

export function getStorageAdapter(): StorageAdapter {
	if (!singleton) {
		singleton = createIndexedDbStorageAdapter();
	}
	return singleton;
}

/** Полное удаление БД на устройстве; следующее обращение к адаптеру создаст пустую БД. */
export async function wipeAppIndexedDatabase(): Promise<void> {
	dbPromise = null;
	singleton = null;
	await deleteDB(DB_NAME);
}
