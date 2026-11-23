import { CURRENCIES } from "../../config/currency-catalog";
import { getStorageAdapter } from "./indexed-db-adapter";
import type {
	PersistedBill,
	PersistedContact,
	PersistedContactSettlement,
	PersistedDebt,
	PersistedDebtOperation,
	PersistedMeta,
} from "./schema";

/** Версии 1–3 не содержат общих расчётов и читаются только при импорте. */
export type DebtsBackupPayload = {
	version: 4;
	exportedAt: string;
	meta: PersistedMeta;
	contacts: PersistedContact[];
	debts: PersistedDebt[];
	debtOperations: PersistedDebtOperation[];
	bills: PersistedBill[];
	contactSettlements: PersistedContactSettlement[];
};

export async function createDebtsBackup(): Promise<DebtsBackupPayload> {
	const data = await getStorageAdapter().readAll();
	return {
		...data,
		version: 4,
		exportedAt: new Date().toISOString(),
		debts: data.debts.map((debt) => ({ ...debt, billId: debt.billId ?? null })),
		bills: data.bills.map(normalizeBill),
	};
}

export function serializeDebtsBackup(payload: DebtsBackupPayload): string {
	return JSON.stringify(payload, null, 2);
}

export function buildDebtsBackupFilename(date: Date): string {
	const iso = date.toISOString().slice(0, 10);
	return `debts-backup-${iso}.json`;
}

/** Счета, записанные до деления по чеку, не имеют полей `items`, `discount` и `tips`. */
export function normalizeBill(bill: PersistedBill): PersistedBill {
	return { ...bill, items: bill.items ?? [], discount: bill.discount ?? null, tips: bill.tips ?? null };
}

function isPersistedMeta(value: unknown): value is PersistedMeta {
	return typeof value === "object" && value !== null && typeof (value as PersistedMeta).schemaVersion === "number";
}

function positiveCents(value: number): boolean {
	return Number.isSafeInteger(value) && value > 0;
}

function validateSettlementHistory(
	settlements: PersistedContactSettlement[],
	debts: PersistedDebt[],
	operations: PersistedDebtOperation[],
	contacts: PersistedContact[],
): void {
	const bad = () => new Error("Неверная история общих расчётов в резервной копии.");
	const byId = new Map<string, PersistedContactSettlement>();
	const debtsById = new Map(debts.map((debt) => [debt.id, debt]));
	const contactIds = new Set(contacts.map((contact) => contact.id));
	const direction = (value: unknown) => value === "i_owe" || value === "owed_to_me";
	const links = new Set<string>();
	const liveLinks = new Map<string, Set<string>>();
	for (const row of settlements) {
		if (
			!row ||
			typeof row.id !== "string" ||
			byId.has(row.id) ||
			!contactIds.has(row.contactId) ||
			typeof row.createdAt !== "string" ||
			!Number.isFinite(Date.parse(row.createdAt)) ||
			!Object.hasOwn(CURRENCIES, row.currency) ||
			!Array.isArray(row.debts) ||
			!row.debts.length ||
			row.debts.some(
				(debt) =>
					!debt ||
					typeof debt.debtId !== "string" ||
					(debt.label !== null && typeof debt.label !== "string") ||
					!direction(debt.direction) ||
					!positiveCents(debt.cents),
			) ||
			(row.transfer !== null &&
				(!row.transfer ||
					!positiveCents(row.transfer.cents) ||
					!["sent", "received"].includes(row.transfer.direction))) ||
			(row.remainder !== null &&
				(!row.remainder ||
					typeof row.remainder.debtId !== "string" ||
					!positiveCents(row.remainder.cents) ||
					!direction(row.remainder.direction)))
		) {
			throw bad();
		}
		const owed = row.debts.reduce((sum, debt) => sum + (debt.direction === "owed_to_me" ? debt.cents : 0), 0);
		const due = row.debts.reduce((sum, debt) => sum + (debt.direction === "i_owe" ? debt.cents : 0), 0);
		const delta =
			owed - due + (row.transfer?.direction === "received" ? -row.transfer.cents : (row.transfer?.cents ?? 0));
		if (
			owed !== row.owedToMeCents ||
			due !== row.iOweCents ||
			!Number.isSafeInteger(owed) ||
			!Number.isSafeInteger(due) ||
			(!row.transfer && (!owed || !due)) ||
			new Set(row.debts.map((debt) => debt.debtId)).size !== row.debts.length ||
			Math.abs(delta) !== (row.remainder?.cents ?? 0) ||
			(row.remainder && row.remainder.direction !== (delta > 0 ? "owed_to_me" : "i_owe"))
		)
			throw bad();
		byId.set(row.id, row);
	}
	for (const op of operations) {
		if (op.kind !== "settlement_close" && op.settlementId === undefined) continue;
		const row = typeof op.settlementId === "string" ? byId.get(op.settlementId) : undefined;
		const debt = debtsById.get(op.debtId);
		if (!row || !debt || debt.contactId !== row.contactId) throw bad();
		if (
			op.kind === "initial"
				? row.remainder?.debtId !== op.debtId
				: op.kind !== "settlement_close" ||
					!row.debts.some((entry) => entry.debtId === op.debtId && entry.cents === Math.round(op.amount * 100))
		)
			throw bad();
		links.add(row.id);
		const debtIds = liveLinks.get(row.id) ?? new Set<string>();
		if (debtIds.has(op.debtId)) throw bad();
		debtIds.add(op.debtId);
		liveLinks.set(row.id, debtIds);
	}
	if (links.size !== byId.size) throw bad();
	for (const row of settlements) {
		const liveIds = liveLinks.get(row.id);
		const snapshotIds = [...row.debts.map((debt) => debt.debtId), ...(row.remainder ? [row.remainder.debtId] : [])];
		if (snapshotIds.some((id) => debtsById.has(id) && !liveIds?.has(id))) throw bad();
	}
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
		(version !== 1 && version !== 2 && version !== 3 && version !== 4) ||
		typeof candidate.exportedAt !== "string" ||
		!Array.isArray(candidate.contacts) ||
		!Array.isArray(candidate.debts) ||
		!Array.isArray(candidate.debtOperations) ||
		!isPersistedMeta(candidate.meta) ||
		(version !== 1 && !Array.isArray(candidate.bills)) ||
		(version === 4 && !Array.isArray(candidate.contactSettlements))
	) {
		throw new Error("Неверный формат резервной копии.");
	}
	const rawBills = version === 1 ? [] : (candidate.bills ?? []);
	// Счёт по чеку без позиций не посчитать; у копий версии 2 позиций нет ни у одного счёта.
	if (
		(version === 3 || version === 4) &&
		rawBills.some((bill) => bill.splitMode === "items" && !Array.isArray(bill.items))
	) {
		throw new Error("Неверный формат резервной копии.");
	}
	const bills = rawBills.map(normalizeBill);
	const billIds = new Set(bills.map((bill) => bill.id));
	const contactSettlements = version === 4 ? (candidate.contactSettlements ?? []) : [];
	validateSettlementHistory(contactSettlements, candidate.debts, candidate.debtOperations, candidate.contacts);
	return {
		version: 4,
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
		contactSettlements,
	};
}

/** Полная замена данных в IndexedDB содержимым резервной копии (одной транзакцией). */
export async function restoreDebtsFromBackup(payload: DebtsBackupPayload): Promise<void> {
	await getStorageAdapter().replaceAll(payload);
}
