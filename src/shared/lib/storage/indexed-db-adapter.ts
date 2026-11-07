import { type DBSchema, deleteDB, type IDBPDatabase, openDB } from "idb";
import type { StorageAdapter } from "./contract";
import type {
	CreationDraft,
	CreationDraftKind,
	PersistedBill,
	PersistedContact,
	PersistedDebt,
	PersistedDebtOperation,
	PersistedMeta,
} from "./schema";

const DB_NAME = "debts";
const DB_VERSION = 3;
const CURRENT_SCHEMA_VERSION = 3;

type MetaRow = PersistedMeta & { key: string };

interface DebtsDBSchema extends DBSchema {
	creationDrafts: { key: CreationDraftKind; value: CreationDraft };
	contacts: {
		key: string;
		value: PersistedContact;
	};
	debts: {
		key: string;
		value: PersistedDebt;
		indexes: { "by-contactId": string; "by-billId": string };
	};
	debtOperations: {
		key: string;
		value: PersistedDebtOperation;
		indexes: { "by-debtId": string };
	};
	bills: {
		key: string;
		value: PersistedBill;
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
			upgrade(database, oldVersion, _newVersion, tx) {
				if (oldVersion < 1) {
					database.createObjectStore("contacts", { keyPath: "id" });
					const debtsStore = database.createObjectStore("debts", { keyPath: "id" });
					debtsStore.createIndex("by-contactId", "contactId");
					const operationsStore = database.createObjectStore("debtOperations", { keyPath: "id" });
					operationsStore.createIndex("by-debtId", "debtId");
					database.createObjectStore("meta", { keyPath: "key" });
				}
				if (oldVersion < 2) {
					// Старые долги не переписываются: отсутствующий billId читается как null и не попадает в индекс.
					database.createObjectStore("bills", { keyPath: "id" });
					tx.objectStore("debts").createIndex("by-billId", "billId");
				}
				if (oldVersion < 3) database.createObjectStore("creationDrafts", { keyPath: "kind" });
			},
			blocking() {
				// Другой клиент удаляет или обновляет БД — отпускаем соединение, чтобы не держать его.
				void closeDb();
			},
		});
	}
	return dbPromise;
}

async function closeDb(): Promise<void> {
	const pending = dbPromise;
	dbPromise = null;
	const db = await pending?.catch(() => null);
	db?.close();
}

const META_KEY = "app";

/** Синхронное исключение внутри транзакции (например, DataError у `put`) её не отменяет — отменяем сами. */
async function commitOrAbort(tx: { done: Promise<void>; abort(): void }, write: () => Promise<void>): Promise<void> {
	try {
		await write();
	} catch (e) {
		try {
			tx.abort();
		} catch {
			// Транзакция уже завершилась или отменена.
		}
		await tx.done.catch(() => undefined);
		throw e;
	}
	await tx.done;
}

function createIndexedDbStorageAdapter(): StorageAdapter {
	return {
		async getCreationDraft(kind) {
			return (await getDb()).get("creationDrafts", kind);
		},
		async putCreationDraft(draft) {
			const db = await getDb();
			const tx = db.transaction("creationDrafts", "readwrite");
			await commitOrAbort(tx, async () => {
				await tx.store.put(draft);
			});
		},
		async deleteCreationDraft(kind, expectedId) {
			const db = await getDb();
			const tx = db.transaction("creationDrafts", "readwrite");
			await commitOrAbort(tx, async () => {
				const current = await tx.store.get(kind);
				if (current && current.id !== expectedId) throw new Error("Draft session changed");
				await tx.store.delete(kind);
			});
		},
		async putDebtWithOperation(debt, operation, draftId) {
			const db = await getDb();
			const tx = db.transaction(["debts", "debtOperations", "creationDrafts"], "readwrite");
			await commitOrAbort(tx, async () => {
				await tx.objectStore("debts").put(debt);
				await tx.objectStore("debtOperations").put(operation);
				const current = await tx.objectStore("creationDrafts").get("debt");
				if (draftId && current?.id === draftId) await tx.objectStore("creationDrafts").delete("debt");
			});
		},
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

		async getAllBills() {
			const db = await getDb();
			return db.getAll("bills");
		},

		async putBillWithDebts(bill, upsertDebts, upsertOperations, deleteDebtIds, draftId) {
			const db = await getDb();
			const tx = db.transaction(["bills", "debts", "debtOperations", "creationDrafts"], "readwrite");
			const debtsStore = tx.objectStore("debts");
			const operationsStore = tx.objectStore("debtOperations");
			const operationsIndex = operationsStore.index("by-debtId");
			await commitOrAbort(tx, async () => {
				await tx.objectStore("bills").put(bill);
				const current = await tx.objectStore("creationDrafts").get("bill");
				if (draftId && current?.id === draftId) await tx.objectStore("creationDrafts").delete("bill");
				for (const debtId of deleteDebtIds) {
					for (const operationId of await operationsIndex.getAllKeys(debtId)) {
						await operationsStore.delete(operationId);
					}
					await debtsStore.delete(debtId);
				}
				for (const debt of upsertDebts) {
					await debtsStore.put(debt);
				}
				for (const operation of upsertOperations) {
					await operationsStore.put(operation);
				}
			});
		},

		async deleteBillCascade(billId: string) {
			const db = await getDb();
			const tx = db.transaction(["bills", "debts", "debtOperations"], "readwrite");
			const debtsStore = tx.objectStore("debts");
			const operationsStore = tx.objectStore("debtOperations");
			const operationsIndex = operationsStore.index("by-debtId");
			await commitOrAbort(tx, async () => {
				for (const debtId of await debtsStore.index("by-billId").getAllKeys(billId)) {
					for (const operationId of await operationsIndex.getAllKeys(debtId)) {
						await operationsStore.delete(operationId);
					}
					await debtsStore.delete(debtId);
				}
				await tx.objectStore("bills").delete(billId);
			});
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
				? { schemaVersion: CURRENT_SCHEMA_VERSION, ratesCache: row.ratesCache }
				: { schemaVersion: CURRENT_SCHEMA_VERSION, ratesCache: null };
		},

		async setMeta(meta: PersistedMeta) {
			const db = await getDb();
			await db.put("meta", { key: META_KEY, ...meta, schemaVersion: CURRENT_SCHEMA_VERSION });
		},

		async replaceAll({ contacts, debts, debtOperations, bills, meta }) {
			const db = await getDb();
			const tx = db.transaction(
				["contacts", "debts", "debtOperations", "bills", "meta", "creationDrafts"],
				"readwrite",
			);
			const contactsStore = tx.objectStore("contacts");
			const debtsStore = tx.objectStore("debts");
			const operationsStore = tx.objectStore("debtOperations");
			const billsStore = tx.objectStore("bills");
			const metaStore = tx.objectStore("meta");
			await commitOrAbort(tx, async () => {
				await tx.objectStore("creationDrafts").clear();
				await contactsStore.clear();
				await debtsStore.clear();
				await operationsStore.clear();
				await billsStore.clear();
				await metaStore.clear();
				for (const row of contacts) await contactsStore.put(row);
				for (const row of debts) await debtsStore.put(row);
				for (const row of debtOperations) await operationsStore.put(row);
				for (const row of bills) await billsStore.put(row);
				await metaStore.put({ key: META_KEY, ...meta, schemaVersion: CURRENT_SCHEMA_VERSION });
			});
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
	// Открытое соединение блокирует deleteDB до выхода из приложения — закрываем его заранее.
	await closeDb();
	singleton = null;
	await deleteDB(DB_NAME);
}
