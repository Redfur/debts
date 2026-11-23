import { computeDebtBalance } from "./compute-debt-balance.ts";
import type { Debt, DebtOperation } from "./types";

type Direction = Debt["direction"];
type SettlementDebt = { debt: Debt; balanceCents: number };
export type SettlementBasis = { debts: SettlementDebt[]; owedToMeCents: number; iOweCents: number; netCents: number };
export type SettlementTransfer = { direction: "sent" | "received"; cents: number };

export function sameSettlementBasis(current: SettlementBasis, expected: SettlementBasis): boolean {
	const byId = new Map(current.debts.map((entry) => [entry.debt.id, entry]));
	return (
		byId.size === expected.debts.length &&
		expected.debts.every(({ debt, balanceCents }) => {
			const row = byId.get(debt.id);
			return row?.balanceCents === balanceCents && row.debt.direction === debt.direction;
		})
	);
}

export function computeSettlementBasis(
	contactId: string,
	currency: Debt["currency"],
	debts: Iterable<Debt>,
	operationsByDebtId: Readonly<Record<string, DebtOperation[]>>,
): SettlementBasis {
	const selected: SettlementDebt[] = [];
	let owedToMeCents = 0;
	let iOweCents = 0;
	for (const debt of debts) {
		if (debt.contactId !== contactId || debt.currency !== currency || debt.status !== "active") continue;
		const balanceCents = Math.round(computeDebtBalance(debt, operationsByDebtId[debt.id] ?? []) * 100);
		if (balanceCents <= 0) continue;
		selected.push({ debt, balanceCents });
		if (debt.direction === "owed_to_me") owedToMeCents += balanceCents;
		else iOweCents += balanceCents;
	}
	return { debts: selected, owedToMeCents, iOweCents, netCents: owedToMeCents - iOweCents };
}

export function computeSettlementRemainder(
	basis: SettlementBasis,
	transfer: SettlementTransfer | null,
): { direction: Direction; cents: number } | null | undefined {
	const cents = transfer?.cents ?? 0;
	if (
		!basis.debts.length ||
		!Number.isSafeInteger(basis.owedToMeCents) ||
		!Number.isSafeInteger(basis.iOweCents) ||
		!Number.isSafeInteger(cents) ||
		cents < 0 ||
		(cents === 0 && (!basis.owedToMeCents || !basis.iOweCents))
	) {
		return undefined;
	}
	const netCents = basis.netCents + (transfer?.direction === "received" ? -cents : cents);
	if (!Number.isSafeInteger(netCents)) return undefined;
	if (netCents === 0) return null;
	return { direction: netCents > 0 ? "owed_to_me" : "i_owe", cents: Math.abs(netCents) };
}
