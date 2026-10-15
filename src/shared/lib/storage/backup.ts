import { getStorageAdapter } from "./indexed-db-adapter";
import type { PersistedBill, PersistedContact, PersistedDebt, PersistedDebtOperation, PersistedMeta } from "./schema";

/** Версия 1 — без счетов; читается при импорте, но не пишется. */
export type DebtsBackupPayload = {
	version: 2;
	exportedAt: string;
	meta: PersistedMeta;
	contacts: PersistedContact[];
	debts: PersistedDebt[];
	debtOperations: PersistedDebtOperation[];
	bills: PersistedBill[];
};

export async function createDebtsBackup(): Promise<DebtsBackupPayload> {
	const storage = getStorageAdapter();
	const [contacts, debts, debtOperations, bills, meta] = await Promise.all([
		storage.getAllContacts(),
		storage.getAllDebts(),
		storage.getAllDebtOperations(),
		storage.getAllBills(),
		storage.getMeta(),
	]);
	return {
		version: 2,
		exportedAt: new Date().toISOString(),
		meta,
		contacts,
		debts: debts.map((debt) => ({ ...debt, billId: debt.billId ?? null })),
		debtOperations,
		bills,
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
	const candidate = parsed as Partial<Omit<DebtsBackupPayload, "version">> & { version?: unknown };
	const version = candidate.version;
	if (
		(version !== 1 && version !== 2) ||
		typeof candidate.exportedAt !== "string" ||
		!Array.isArray(candidate.contacts) ||
		!Array.isArray(candidate.debts) ||
		!Array.isArray(candidate.debtOperations) ||
		!isPersistedMeta(candidate.meta) ||
		(version === 2 && !Array.isArray(candidate.bills))
	) {
		throw new Error("Неверный формат резервной копии.");
	}
	const bills = version === 2 ? (candidate.bills ?? []) : [];
	const billIds = new Set(bills.map((bill) => bill.id));
	return {
		version: 2,
		exportedAt: candidate.exportedAt,
		meta: candidate.meta,
		contacts: candidate.contacts,
		// Долг, ссылающийся на отсутствующий счёт, становится обычным.
		debts: candidate.debts.map((debt) => ({
			...debt,
			billId: debt.billId && billIds.has(debt.billId) ? debt.billId : null,
		})),
		debtOperations: candidate.debtOperations,
		bills,
	};
}

/** Полная замена данных в IndexedDB содержимым резервной копии (одной транзакцией). */
export async function restoreDebtsFromBackup(payload: DebtsBackupPayload): Promise<void> {
	await getStorageAdapter().replaceAll(payload);
}
