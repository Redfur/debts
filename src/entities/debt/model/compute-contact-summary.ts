import { roundAmount } from "@/shared/lib/round-amount";
import { computeDebtBalance } from "./compute-debt-balance";
import type { ContactSummary, Debt, DebtOperation } from "./types";

/** Сумма активных долгов контакта по валютам, раздельно по направлению. */
export function computeContactSummary(
	contactId: string,
	debtsById: Record<string, Debt>,
	operationsByDebtId: Record<string, DebtOperation[]>,
): ContactSummary {
	const owedToMeByCurrency: ContactSummary["owedToMeByCurrency"] = {};
	const owedByMeByCurrency: ContactSummary["owedByMeByCurrency"] = {};

	for (const debt of Object.values(debtsById)) {
		if (debt.contactId !== contactId || debt.status !== "active") continue;
		const balance = computeDebtBalance(debt, operationsByDebtId[debt.id] ?? []);
		if (balance <= 0) continue;
		const bucket = debt.direction === "owed_to_me" ? owedToMeByCurrency : owedByMeByCurrency;
		bucket[debt.currency] = roundAmount((bucket[debt.currency] ?? 0) + balance);
	}

	return { owedToMeByCurrency, owedByMeByCurrency };
}
