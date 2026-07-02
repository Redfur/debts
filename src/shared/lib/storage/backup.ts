import { getStorageAdapter, wipeAppIndexedDatabase } from "./indexed-db-adapter";
import type { PersistedContact, PersistedDebt, PersistedDebtOperation, PersistedMeta } from "./schema";

export type DebtsBackupPayload = {
	version: 1;
	exportedAt: string;
	meta: PersistedMeta;
	contacts: PersistedContact[];
	debts: PersistedDebt[];
	debtOperations: PersistedDebtOperation[];
};

export async function createDebtsBackup(): Promise<DebtsBackupPayload> {
	const storage = getStorageAdapter();
	const [contacts, debts, debtOperations, meta] = await Promise.all([
		storage.getAllContacts(),
		storage.getAllDebts(),
		storage.getAllDebtOperations(),
		storage.getMeta(),
	]);
	return {
		version: 1,
		exportedAt: new Date().toISOString(),
		meta,
		contacts,
		debts,
		debtOperations,
	};
}

export function serializeDebtsBackup(payload: DebtsBackupPayload): string {
	return JSON.stringify(payload, null, 2);
}

export function buildDebtsBackupFilename(date: Date): string {
	const iso = date.toISOString().slice(0, 10);
	return `debts-backup-${iso}.json`;
}

function isPersistedMeta(value: unknown): value is PersistedMeta {
	return typeof value === "object" && value !== null && typeof (value as PersistedMeta).schemaVersion === "number";
}

/** Парсит и валидирует резервную копию; бросает с человекочитаемым сообщением при несоответствии формата. */
export function parseDebtsBackup(raw: string): DebtsBackupPayload {
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		throw new Error("Файл повреждён или не является JSON.");
	}
	if (typeof parsed !== "object" || parsed === null) {
		throw new Error("Неверный формат резервной копии.");
	}
	const candidate = parsed as DebtsBackupPayload;
	if (
		!Array.isArray(candidate.contacts) ||
		!Array.isArray(candidate.debts) ||
		!Array.isArray(candidate.debtOperations) ||
		!isPersistedMeta(candidate.meta)
	) {
		throw new Error("Неверный формат резервной копии.");
	}
	return candidate;
}

/** Полная замена данных в IndexedDB содержимым резервной копии. */
export async function restoreDebtsFromBackup(payload: DebtsBackupPayload): Promise<void> {
	await wipeAppIndexedDatabase();
	const storage = getStorageAdapter();
	for (const contact of payload.contacts) {
		await storage.putContact(contact);
	}
	for (const debt of payload.debts) {
		await storage.putDebt(debt);
	}
	for (const operation of payload.debtOperations) {
		await storage.putDebtOperation(operation);
	}
	await storage.setMeta(payload.meta);
}
