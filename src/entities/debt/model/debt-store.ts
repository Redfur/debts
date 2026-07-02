import { create } from "zustand";
import { pickContactColor } from "@/shared/config/contact-colors";
import { fetchExchangeRates, isRatesCacheStale } from "@/shared/lib/exchange-rate";
import { generateId } from "@/shared/lib/id";
import { roundAmount } from "@/shared/lib/round-amount";
import type {
	CurrencyCode,
	DebtDirection,
	ExchangeRatesCache,
	PersistedContact,
	PersistedDebt,
	PersistedDebtOperation,
} from "@/shared/lib/storage";
import { getStorageAdapter } from "@/shared/lib/storage";
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
	refreshRatesIfStale: (force?: boolean) => Promise<void>;
	clearError: () => void;
};

export const useDebtStore = create<DebtState>((set, get) => ({
	contactsById: {},
	debtsById: {},
	operationsByDebtId: {},
	ratesCache: null,
	ratesFetchError: null,
	hydrated: false,
	lastError: null,

	clearError: () => set({ lastError: null }),

	hydrate: async () => {
		const storage = getStorageAdapter();
		try {
			const [contacts, debts, operations, meta] = await Promise.all([
				storage.getAllContacts(),
				storage.getAllDebts(),
				storage.getAllDebtOperations(),
				storage.getMeta(),
			]);
			set({
				contactsById: contactsToRecord(contacts),
				debtsById: debtsToRecord(debts),
				operationsByDebtId: groupOperationsByDebt(operations),
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
