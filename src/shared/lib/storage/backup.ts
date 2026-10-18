import { getStorageAdapter } from "./indexed-db-adapter";
import type { PersistedBill, PersistedContact, PersistedDebt, PersistedDebtOperation, PersistedMeta } from "./schema";

/** Версия 1 — без счетов, 2 — счета без позиций чека; обе читаются при импорте, но не пишутся. */
export type DebtsBackupPayload = {
	version: 3;
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
		version: 3,
		exportedAt: new Date().toISOString(),
		meta,
		contacts,
		debts: debts.map((debt) => ({ ...debt, billId: debt.billId ?? null })),
		debtOperations,
		bills: bills.map(normalizeBill),
	};
}

export function serializeDebtsBackup(payload: DebtsBackupPayload): string {
	return JSON.stringify(payload, null, 2);
}

export function buildDebtsBackupFilename(date: Date): string {
	const iso = date.toISOString().slice(0, 10);
	return `debts-backup-${iso}.json`;
}

/** Счета, записанные до деления по чеку, не имеют поля `items`. */
function normalizeBill(bill: PersistedBill): PersistedBill {
	return { ...bill, items: bill.items ?? [] };
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
		(version !== 1 && version !== 2 && version !== 3) ||
		typeof candidate.exportedAt !== "string" ||
		!Array.isArray(candidate.contacts) ||
		!Array.isArray(candidate.debts) ||
		!Array.isArray(candidate.debtOperations) ||
		!isPersistedMeta(candidate.meta) ||
		(version !== 1 && !Array.isArray(candidate.bills))
	) {
		throw new Error("Неверный формат резервной копии.");
	}
	const rawBills = version === 1 ? [] : (candidate.bills ?? []);
	// Счёт по чеку без позиций не посчитать; у копий версии 2 позиций нет ни у одного счёта.
	if (version === 3 && rawBills.some((bill) => bill.splitMode === "items" && !Array.isArray(bill.items))) {
		throw new Error("Неверный формат резервной копии.");
	}
	const bills = rawBills.map(normalizeBill);
	const billIds = new Set(bills.map((bill) => bill.id));
	return {
		version: 3,
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
