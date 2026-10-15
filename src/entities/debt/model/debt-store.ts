import { create } from "zustand";
import { pickContactColor } from "@/shared/config/contact-colors";
import { fetchExchangeRates, isRatesCacheStale } from "@/shared/lib/exchange-rate";
import { generateId } from "@/shared/lib/id";
import { roundAmount } from "@/shared/lib/round-amount";
import type {
	BillParticipant,
	BillSplitMode,
	CurrencyCode,
	DebtDirection,
	ExchangeRatesCache,
	PersistedBill,
	PersistedContact,
	PersistedDebt,
	PersistedDebtOperation,
} from "@/shared/lib/storage";
import { getStorageAdapter } from "@/shared/lib/storage";
import { computeBillTransfers, computeMyBillDebts, validateBill } from "./bill/compute-bill";
import { ME_REF } from "./bill/types";
import { computeDebtBalance } from "./compute-debt-balance";

function contactsToRecord(rows: PersistedContact[]): Record<string, PersistedContact> {
	return Object.fromEntries(rows.map((r) => [r.id, r]));
}

function debtsToRecord(rows: PersistedDebt[]): Record<string, PersistedDebt> {
	return Object.fromEntries(rows.map((r) => [r.id, r]));
}

function groupOperationsByDebt(rows: PersistedDebtOperation[]): Record<string, PersistedDebtOperation[]> {
	const grouped: Record<string, PersistedDebtOperation[]> = {};
	for (const row of rows) {
		if (!grouped[row.debtId]) grouped[row.debtId] = [];
		grouped[row.debtId].push(row);
	}
	for (const list of Object.values(grouped)) {
		list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
	}
	return grouped;
}

type BillPatch = {
	bills?: Record<string, PersistedBill | undefined>;
	debts?: Record<string, PersistedDebt | undefined>;
	operations?: Record<string, PersistedDebtOperation[] | undefined>;
};

type CollectionsState = Pick<DebtState, "billsById" | "debtsById" | "operationsByDebtId">;

/** Точечно меняет записи коллекций (`undefined` — удалить), возвращая обратный патч для отката. */
function applyPatch(s: CollectionsState, patch: BillPatch): { next: CollectionsState; inverse: BillPatch } {
	const apply = <T>(source: Record<string, T>, changes: Record<string, T | undefined> | undefined) => {
		const inverse: Record<string, T | undefined> = {};
		if (!changes) return { result: source, inverse };
		const result = { ...source };
		for (const [id, value] of Object.entries(changes)) {
			inverse[id] = source[id];
			if (value === undefined) delete result[id];
			else result[id] = value;
		}
		return { result, inverse };
	};
	const bills = apply(s.billsById, patch.bills);
	const debts = apply(s.debtsById, patch.debts);
	const operations = apply(s.operationsByDebtId, patch.operations);
	return {
		next: { billsById: bills.result, debtsById: debts.result, operationsByDebtId: operations.result },
		inverse: { bills: bills.inverse, debts: debts.inverse, operations: operations.inverse },
	};
}

function selectBillDebts(debtsById: Record<string, PersistedDebt>, billId: string): PersistedDebt[] {
	return Object.values(debtsById).filter((d) => d.billId === billId);
}

function buildDebtRow(
	contactId: string,
	direction: DebtDirection,
	currency: CurrencyCode,
	amount: number,
	note: string | null,
	now: string,
	billId: string | null,
): PersistedDebt {
	return {
		id: generateId(),
		contactId,
		direction,
		currency,
		principalAmount: amount,
		note,
		status: "active",
		createdAt: now,
		updatedAt: now,
		closedAt: null,
		billId,
	};
}

function buildInitialOperation(debtId: string, amount: number, now: string): PersistedDebtOperation {
	return { id: generateId(), debtId, kind: "initial", amount, note: null, createdAt: now };
}

export type BillInput = {
	title: string;
	currency: CurrencyCode;
	totalAmount: number;
	splitMode: BillSplitMode;
	/** `ref` — `"me"` или id существующего контакта. */
	participants: BillParticipant[];
};

type CreateDebtInput = {
	contactId: string;
	direction: DebtDirection;
	currency: CurrencyCode;
	amount: number;
	note?: string;
};

type UpdateDebtInput = {
	/** Направление, валюта и сумма меняются только пока по долгу нет ни одного погашения. */
	direction?: DebtDirection;
	currency?: CurrencyCode;
	amount?: number;
	note?: string;
};

type DebtState = {
	contactsById: Record<string, PersistedContact>;
	debtsById: Record<string, PersistedDebt>;
	operationsByDebtId: Record<string, PersistedDebtOperation[]>;
	billsById: Record<string, PersistedBill>;
	ratesCache: ExchangeRatesCache | null;
	ratesFetchError: string | null;
	hydrated: boolean;
	lastError: string | null;
	hydrate: () => Promise<void>;
	getOrCreateContact: (name: string) => Promise<string | undefined>;
	createDebt: (input: CreateDebtInput) => Promise<string | undefined>;
	updateDebt: (id: string, patch: UpdateDebtInput) => Promise<boolean>;
	addRepayment: (debtId: string, amount: number, note?: string) => Promise<boolean>;
	deleteDebt: (id: string) => Promise<boolean>;
	createBill: (input: BillInput) => Promise<string | undefined>;
	/** Пока по долгам счёта нет погашений, меняется всё; после — только описание (иначе отказ). */
	updateBill: (id: string, input: BillInput) => Promise<boolean>;
	deleteBill: (id: string) => Promise<boolean>;
	/** Только для счёта без моих долгов. */
	setBillManualClosed: (id: string, closed: boolean) => Promise<boolean>;
	refreshRatesIfStale: (force?: boolean) => Promise<void>;
	clearError: () => void;
};

export const useDebtStore = create<DebtState>((set, get) => ({
	contactsById: {},
	debtsById: {},
	operationsByDebtId: {},
	billsById: {},
	ratesCache: null,
	ratesFetchError: null,
	hydrated: false,
	lastError: null,

	clearError: () => set({ lastError: null }),

	hydrate: async () => {
		const storage = getStorageAdapter();
		try {
			const [contacts, debts, operations, bills, meta] = await Promise.all([
				storage.getAllContacts(),
				storage.getAllDebts(),
				storage.getAllDebtOperations(),
				storage.getAllBills(),
				storage.getMeta(),
			]);
			set({
				contactsById: contactsToRecord(contacts),
				// Долги, записанные до появления счетов, не имеют поля billId.
				debtsById: debtsToRecord(debts.map((d) => ({ ...d, billId: d.billId ?? null }))),
				operationsByDebtId: groupOperationsByDebt(operations),
				billsById: Object.fromEntries(bills.map((b) => [b.id, b])),
				ratesCache: meta.ratesCache,
				hydrated: true,
				lastError: null,
			});
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			set({ hydrated: true, lastError: message });
		}
		void get().refreshRatesIfStale();
	},

	getOrCreateContact: async (name: string) => {
		const trimmed = name.trim();
		if (!trimmed) return undefined;

		const existing = Object.values(get().contactsById).find(
			(c) => !c.archivedAt && c.name.toLowerCase() === trimmed.toLowerCase(),
		);
		if (existing) return existing.id;

		const now = new Date().toISOString();
		const row: PersistedContact = {
			id: generateId(),
			name: trimmed,
			colorValue: pickContactColor(trimmed),
			createdAt: now,
			updatedAt: now,
			archivedAt: null,
		};
		set((s) => ({ contactsById: { ...s.contactsById, [row.id]: row }, lastError: null }));
		try {
			await getStorageAdapter().putContact(row);
			return row.id;
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			set((s) => {
				const next = { ...s.contactsById };
				delete next[row.id];
				return { contactsById: next, lastError: message };
			});
			return undefined;
		}
	},

	createDebt: async (input: CreateDebtInput) => {
		const amount = roundAmount(input.amount);
		if (!Number.isFinite(amount) || amount <= 0) return undefined;
		if (!get().contactsById[input.contactId]) return undefined;

		const now = new Date().toISOString();
		const debtRow: PersistedDebt = {
			id: generateId(),
			contactId: input.contactId,
			direction: input.direction,
			currency: input.currency,
			principalAmount: amount,
			note: input.note?.trim() || null,
			status: "active",
			createdAt: now,
			updatedAt: now,
			closedAt: null,
			billId: null,
		};
		const operationRow: PersistedDebtOperation = {
			id: generateId(),
			debtId: debtRow.id,
			kind: "initial",
			amount,
			note: null,
			createdAt: now,
		};

		set((s) => ({
			debtsById: { ...s.debtsById, [debtRow.id]: debtRow },
			operationsByDebtId: { ...s.operationsByDebtId, [debtRow.id]: [operationRow] },
			lastError: null,
		}));

		try {
			const storage = getStorageAdapter();
			await storage.putDebt(debtRow);
			await storage.putDebtOperation(operationRow);
			return debtRow.id;
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			set((s) => {
				const nextDebts = { ...s.debtsById };
				delete nextDebts[debtRow.id];
				const nextOps = { ...s.operationsByDebtId };
				delete nextOps[debtRow.id];
				return { debtsById: nextDebts, operationsByDebtId: nextOps, lastError: message };
			});
			return undefined;
		}
	},

	updateDebt: async (id: string, patch: UpdateDebtInput) => {
		const debt = get().debtsById[id];
		if (!debt) return false;
		const prevOperations = get().operationsByDebtId[id] ?? [];
		const hasRepayment = prevOperations.some((op) => op.kind === "repayment");

		const now = new Date().toISOString();
		const updatedDebt: PersistedDebt = { ...debt, updatedAt: now };
		let updatedInitialOp: PersistedDebtOperation | undefined;

		if (!hasRepayment) {
			if (patch.amount !== undefined) {
				const amount = roundAmount(patch.amount);
				if (!Number.isFinite(amount) || amount <= 0) return false;
				updatedDebt.principalAmount = amount;
				const initialOp = prevOperations.find((op) => op.kind === "initial");
				if (initialOp) updatedInitialOp = { ...initialOp, amount };
			}
			if (patch.direction !== undefined) updatedDebt.direction = patch.direction;
			if (patch.currency !== undefined) updatedDebt.currency = patch.currency;
		}
		if (patch.note !== undefined) updatedDebt.note = patch.note.trim() || null;

		const nextOperations = updatedInitialOp
			? prevOperations.map((op) => (op.id === updatedInitialOp?.id ? updatedInitialOp : op))
			: prevOperations;

		set((s) => ({
			debtsById: { ...s.debtsById, [id]: updatedDebt },
			operationsByDebtId: { ...s.operationsByDebtId, [id]: nextOperations },
			lastError: null,
		}));

		try {
			const storage = getStorageAdapter();
			await storage.putDebt(updatedDebt);
			if (updatedInitialOp) await storage.putDebtOperation(updatedInitialOp);
			return true;
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			set((s) => ({
				debtsById: { ...s.debtsById, [id]: debt },
				operationsByDebtId: { ...s.operationsByDebtId, [id]: prevOperations },
				lastError: message,
			}));
			return false;
		}
	},

	addRepayment: async (debtId: string, amount: number, note?: string) => {
		const roundedAmount = roundAmount(amount);
		const debt = get().debtsById[debtId];
		if (!debt || debt.status !== "active") return false;
		if (!Number.isFinite(roundedAmount) || roundedAmount <= 0) return false;

		const prevOperations = get().operationsByDebtId[debtId] ?? [];
		const balance = computeDebtBalance(debt, prevOperations);
		if (roundedAmount > balance) return false;

		const now = new Date().toISOString();
		const operationRow: PersistedDebtOperation = {
			id: generateId(),
			debtId,
			kind: "repayment",
			amount: roundedAmount,
			note: note?.trim() || null,
			createdAt: now,
		};
		const nextBalance = roundAmount(balance - roundedAmount);
		const updatedDebt: PersistedDebt =
			nextBalance <= 0 ? { ...debt, status: "closed", closedAt: now, updatedAt: now } : { ...debt, updatedAt: now };

		set((s) => ({
			debtsById: { ...s.debtsById, [debtId]: updatedDebt },
			operationsByDebtId: { ...s.operationsByDebtId, [debtId]: [...prevOperations, operationRow] },
			lastError: null,
		}));

		try {
			const storage = getStorageAdapter();
			await storage.putDebtOperation(operationRow);
			await storage.putDebt(updatedDebt);
			return true;
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			set((s) => ({
				debtsById: { ...s.debtsById, [debtId]: debt },
				operationsByDebtId: { ...s.operationsByDebtId, [debtId]: prevOperations },
				lastError: message,
			}));
			return false;
		}
	},

	deleteDebt: async (id: string) => {
		const prevDebt = get().debtsById[id];
		if (!prevDebt) return false;
		const prevOperations = get().operationsByDebtId[id] ?? [];

		set((s) => {
			const nextDebts = { ...s.debtsById };
			delete nextDebts[id];
			const nextOps = { ...s.operationsByDebtId };
			delete nextOps[id];
			return { debtsById: nextDebts, operationsByDebtId: nextOps, lastError: null };
		});

		try {
			await getStorageAdapter().deleteDebt(id);
			return true;
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			set((s) => ({
				debtsById: { ...s.debtsById, [id]: prevDebt },
				operationsByDebtId: { ...s.operationsByDebtId, [id]: prevOperations },
				lastError: message,
			}));
			return false;
		}
	},

	createBill: async (input: BillInput) => {
		const draft = { ...input, totalAmount: roundAmount(input.totalAmount) };
		const transfers = computeBillTransfers(draft);
		if (!transfers || validateBill(draft).errors.length > 0) return undefined;
		const { contactsById } = get();
		if (input.participants.some((p) => p.ref !== ME_REF && !contactsById[p.ref])) return undefined;

		const now = new Date().toISOString();
		const note = input.title.trim() || null;
		const bill: PersistedBill = {
			id: generateId(),
			title: note,
			currency: input.currency,
			totalAmount: draft.totalAmount,
			splitMode: input.splitMode,
			participants: input.participants,
			manualClosedAt: null,
			createdAt: now,
			updatedAt: now,
		};
		const debts: PersistedDebt[] = [];
		const operations: PersistedDebtOperation[] = [];
		for (const my of computeMyBillDebts(transfers)) {
			const debt = buildDebtRow(my.contactId, my.direction, input.currency, my.amount, note, now, bill.id);
			debts.push(debt);
			operations.push(buildInitialOperation(debt.id, my.amount, now));
		}

		const saved = await commitBillPatch(
			{
				bills: { [bill.id]: bill },
				debts: Object.fromEntries(debts.map((d) => [d.id, d])),
				operations: Object.fromEntries(operations.map((op) => [op.debtId, [op]])),
			},
			() => getStorageAdapter().putBillWithDebts(bill, debts, operations, []),
		);
		return saved ? bill.id : undefined;
	},

	updateBill: async (id: string, input: BillInput) => {
		const prev = get().billsById[id];
		if (!prev) return false;
		const { debtsById, operationsByDebtId, contactsById } = get();
		const prevDebts = selectBillDebts(debtsById, id);
		const hasRepayments = prevDebts.some((d) => (operationsByDebtId[d.id] ?? []).some((op) => op.kind === "repayment"));
		const now = new Date().toISOString();
		const note = input.title.trim() || null;

		if (hasRepayments) {
			const structureChanged =
				roundAmount(input.totalAmount) !== prev.totalAmount ||
				input.currency !== prev.currency ||
				input.splitMode !== prev.splitMode ||
				JSON.stringify(input.participants) !== JSON.stringify(prev.participants);
			if (structureChanged) return false;
			const bill: PersistedBill = { ...prev, title: note, updatedAt: now };
			const debts = prevDebts.map((d) => ({ ...d, note, updatedAt: now }));
			return commitBillPatch({ bills: { [id]: bill }, debts: Object.fromEntries(debts.map((d) => [d.id, d])) }, () =>
				getStorageAdapter().putBillWithDebts(bill, debts, [], []),
			);
		}

		const draft = { ...input, totalAmount: roundAmount(input.totalAmount) };
		const transfers = computeBillTransfers(draft);
		if (!transfers || validateBill(draft).errors.length > 0) return false;
		if (input.participants.some((p) => p.ref !== ME_REF && !contactsById[p.ref])) return false;

		const myDebts = computeMyBillDebts(transfers);
		const bill: PersistedBill = {
			...prev,
			title: note,
			currency: input.currency,
			totalAmount: draft.totalAmount,
			splitMode: input.splitMode,
			participants: input.participants,
			// Статус счёта с моими долгами следует за долгами.
			manualClosedAt: myDebts.length > 0 ? null : prev.manualClosedAt,
			updatedAt: now,
		};
		// Долги сопоставляются по контакту и направлению: совпавшие сохраняют id и дату создания.
		const unmatched = [...prevDebts];
		const upsertDebts: PersistedDebt[] = [];
		const upsertOperations: PersistedDebtOperation[] = [];
		const operationsPatch: Record<string, PersistedDebtOperation[] | undefined> = {};
		for (const my of myDebts) {
			const index = unmatched.findIndex((d) => d.contactId === my.contactId && d.direction === my.direction);
			if (index >= 0) {
				const [old] = unmatched.splice(index, 1);
				const debt: PersistedDebt = {
					...old,
					currency: input.currency,
					principalAmount: my.amount,
					note,
					updatedAt: now,
				};
				const ops = (operationsByDebtId[old.id] ?? []).map((op) =>
					op.kind === "initial" ? { ...op, amount: my.amount } : op,
				);
				upsertDebts.push(debt);
				upsertOperations.push(...ops);
				operationsPatch[debt.id] = ops;
			} else {
				const debt = buildDebtRow(my.contactId, my.direction, input.currency, my.amount, note, now, id);
				const op = buildInitialOperation(debt.id, my.amount, now);
				upsertDebts.push(debt);
				upsertOperations.push(op);
				operationsPatch[debt.id] = [op];
			}
		}
		const deleteDebtIds = unmatched.map((d) => d.id);
		for (const debtId of deleteDebtIds) operationsPatch[debtId] = undefined;

		return commitBillPatch(
			{
				bills: { [id]: bill },
				debts: {
					...Object.fromEntries(upsertDebts.map((d) => [d.id, d])),
					...Object.fromEntries(deleteDebtIds.map((debtId) => [debtId, undefined])),
				},
				operations: operationsPatch,
			},
			() => getStorageAdapter().putBillWithDebts(bill, upsertDebts, upsertOperations, deleteDebtIds),
		);
	},

	deleteBill: async (id: string) => {
		if (!get().billsById[id]) return false;
		const removed = Object.fromEntries(selectBillDebts(get().debtsById, id).map((d) => [d.id, undefined]));
		return commitBillPatch({ bills: { [id]: undefined }, debts: removed, operations: removed }, () =>
			getStorageAdapter().deleteBillCascade(id),
		);
	},

	setBillManualClosed: async (id: string, closed: boolean) => {
		const prev = get().billsById[id];
		if (!prev || selectBillDebts(get().debtsById, id).length > 0) return false;
		const now = new Date().toISOString();
		const bill: PersistedBill = { ...prev, manualClosedAt: closed ? now : null, updatedAt: now };
		return commitBillPatch({ bills: { [id]: bill } }, () => getStorageAdapter().putBillWithDebts(bill, [], [], []));
	},

	refreshRatesIfStale: async (force = false) => {
		if (!force && !isRatesCacheStale(get().ratesCache, new Date())) return;
		try {
			const rates = await fetchExchangeRates();
			set({ ratesCache: rates, ratesFetchError: null });
			const storage = getStorageAdapter();
			const meta = await storage.getMeta();
			await storage.setMeta({ ...meta, ratesCache: rates });
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			set({ ratesFetchError: message });
		}
	},
}));

/** Оптимистично применяет патч, пишет в хранилище и при ошибке откатывает только затронутые записи. */
async function commitBillPatch(patch: BillPatch, write: () => Promise<void>): Promise<boolean> {
	let inverse: BillPatch = {};
	useDebtStore.setState((s) => {
		const applied = applyPatch(s, patch);
		inverse = applied.inverse;
		return { ...applied.next, lastError: null };
	});
	try {
		await write();
		return true;
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e);
		useDebtStore.setState((s) => ({ ...applyPatch(s, inverse).next, lastError: message }));
		return false;
	}
}
