import type { CurrencyCode } from "../../../shared/config/currency-catalog.ts";
import { computeDebtBalance } from "./compute-debt-balance.ts";
import type { Debt, DebtOperation } from "./types";

/** Сохранённые долги, включая связанные со счётом; черновики и сами счета сюда не входят. */
export function debtCurrencies(debts: Record<string, Debt>, operations: Record<string, DebtOperation[]>) {
	const all = new Set<CurrencyCode>();
	const active = new Set<CurrencyCode>();
	for (const debt of Object.values(debts)) {
		all.add(debt.currency);
		if (debt.status === "active" && computeDebtBalance(debt, operations[debt.id] ?? []) > 0) active.add(debt.currency);
	}
	return { all: [...all], active: [...active] };
}
