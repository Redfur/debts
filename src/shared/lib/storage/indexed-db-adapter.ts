import { type DBSchema, deleteDB, type IDBPDatabase, openDB } from "idb";
import type { StorageAdapter } from "./contract";
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

const DB_NAME = "debts";
const DB_VERSION = 4;
const CURRENT_SCHEMA_VERSION = 4;

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
		indexes: { "by-debtId": string; "by-settlementId": string };
	};
	contactSettlements: { key: string; value: PersistedContactSettlement };
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
				if (oldVersion < 4) {
					database.createObjectStore("contactSettlements", { keyPath: "id" });
					tx.objectStore("debtOperations").createIndex("by-settlementId", "settlementId");
				}
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

function sameDebt(current: PersistedDebt | undefined, expected: PersistedDebt): boolean {
	return (
		current?.updatedAt === expected.updatedAt &&
		current.status === expected.status &&
		current.principalAmount === expected.principalAmount &&
		current.direction === expected.direction &&
		current.currency === expected.currency &&
		current.note === expected.note
	);
}

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

const debtDeletionStores = ["debts", "debtOperations", "bills", "contactSettlements"] as const;

async function deleteDebtsAndOrphanedSettlements(
	db: IDBPDatabase<DebtsDBSchema>,
	debtId: string | null,
	billId: string | null,
): Promise<string[]> {
	const tx = db.transaction(debtDeletionStores, "readwrite");
	const debts = tx.objectStore("debts");
	const operations = tx.objectStore("debtOperations");
	const removed: string[] = [];
	await commitOrAbort(tx, async () => {
		const ids = billId ? await debts.index("by-billId").getAllKeys(billId) : debtId ? [debtId] : [];
		const candidates = new Set<string>();
		for (const id of ids) {
			for (const operation of await operations.index("by-debtId").getAll(id)) {
				if (operation.settlementId) candidates.add(operation.settlementId);
				await operations.delete(operation.id);
			}
			await debts.delete(id);
		}
		if (billId) await tx.objectStore("bills").delete(billId);
		for (const id of candidates) {
			if (!(await operations.index("by-settlementId").count(id))) {
				await tx.objectStore("contactSettlements").delete(id);
				removed.push(id);
			}
		}
	});
	return removed;
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

		async updateDebt(debt, previous, operation) {
			const db = await getDb();
			const tx = db.transaction(["debts", "debtOperations"], "readwrite");
			await commitOrAbort(tx, async () => {
				const debts = tx.objectStore("debts");
				if (!sameDebt(await debts.get(debt.id), previous)) throw new Error("Debt changed before saving");
				await debts.put(debt);
				if (operation) await tx.objectStore("debtOperations").put(operation);
			});
		},

		async deleteDebt(id: string) {
			return deleteDebtsAndOrphanedSettlements(await getDb(), id, null);
		},

		async getAllBills() {
			const db = await getDb();
			return db.getAll("bills");
		},

		async putBillWithDebts(bill, upsertDebts, upsertOperations, deleteDebtIds, draftId, expected) {
			const db = await getDb();
			const tx = db.transaction(["bills", "debts", "debtOperations", "creationDrafts"], "readwrite");
			const debtsStore = tx.objectStore("debts");
			const operationsStore = tx.objectStore("debtOperations");
			const operationsIndex = operationsStore.index("by-debtId");
			await commitOrAbort(tx, async () => {
				if (expected) {
					const currentBill = await tx.objectStore("bills").get(bill.id);
					const currentDebts = await debtsStore.index("by-billId").getAll(bill.id);
					const byId = new Map(currentDebts.map((debt) => [debt.id, debt]));
					if (
						currentBill?.updatedAt !== expected.bill.updatedAt ||
						byId.size !== expected.debts.length ||
						expected.debts.some((debt) => !sameDebt(byId.get(debt.id), debt))
					) {
						throw new Error("Bill changed before saving");
					}
				}
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
			return deleteDebtsAndOrphanedSettlements(await getDb(), null, billId);
		},

		async getAllDebtOperations() {
			const db = await getDb();
			return db.getAll("debtOperations");
		},

		async getAllContactSettlements() {
			return (await getDb()).getAll("contactSettlements");
		},

		async commitContactSettlement(contactId, prepare) {
			const db = await getDb();
			const tx = db.transaction(["contacts", "debts", "debtOperations", "contactSettlements"], "readwrite");
			const debtStore = tx.objectStore("debts");
			const operationStore = tx.objectStore("debtOperations");
			const { result } = await (async () => {
				let result: ReturnType<typeof prepare> = null;
				await commitOrAbort(tx, async () => {
					if (!(await tx.objectStore("contacts").get(contactId))) return;
					const debts = await debtStore.index("by-contactId").getAll(contactId);
					const active = debts.filter((debt) => debt.status === "active");
					const operations = await Promise.all(active.map((debt) => operationStore.index("by-debtId").getAll(debt.id)));
					result = prepare(active, operations.flat());
					if (!result) return;
					await tx.objectStore("contactSettlements").add(result.settlement);
					for (const debt of result.debts) await debtStore.put(debt);
					for (const operation of result.operations) await operationStore.add(operation);
					const changedIds = new Set(result.debts.map((debt) => debt.id));
					result = {
						...result,
						operations: [
							...operations.flat().filter((operation) => changedIds.has(operation.debtId)),
							...result.operations,
						],
					};
				});
				return { result };
			})();
			return result;
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

		async readAll() {
			const db = await getDb();
			const tx = db.transaction(["contacts", "debts", "debtOperations", "bills", "meta", "contactSettlements"]);
			const [contacts, debts, debtOperations, bills, row, contactSettlements] = await Promise.all([
				tx.objectStore("contacts").getAll(),
				tx.objectStore("debts").getAll(),
				tx.objectStore("debtOperations").getAll(),
				tx.objectStore("bills").getAll(),
				tx.objectStore("meta").get(META_KEY),
				tx.objectStore("contactSettlements").getAll(),
				tx.done,
			]);
			return {
				contacts,
				debts,
				debtOperations,
				bills,
				contactSettlements,
				meta: { schemaVersion: CURRENT_SCHEMA_VERSION, ratesCache: row?.ratesCache ?? null },
			};
		},

		async replaceAll({ contacts, debts, debtOperations, bills, contactSettlements, meta }) {
			const db = await getDb();
			const tx = db.transaction(
				["contacts", "debts", "debtOperations", "bills", "meta", "contactSettlements", "creationDrafts"],
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
				await tx.objectStore("contactSettlements").clear();
				for (const row of contacts) await contactsStore.put(row);
				for (const row of debts) await debtsStore.put(row);
				for (const row of debtOperations) await operationsStore.put(row);
				for (const row of bills) await billsStore.put(row);
				for (const row of contactSettlements) await tx.objectStore("contactSettlements").put(row);
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
