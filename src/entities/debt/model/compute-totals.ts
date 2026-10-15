import { roundAmount } from "@/shared/lib/round-amount";
import type { CurrencyCode, ExchangeRatesCache } from "@/shared/lib/storage";
import { convertByCurrency } from "./compute-contact-totals";
import { computeDebtBalance } from "./compute-debt-balance";
import type { Debt, DebtOperation, GlobalTotals } from "./types";

/** Сводка по всем контактам: остатки активных долгов по валютам + конвертация в валюту отображения. */
export function computeGlobalTotals(
	debtsById: Record<string, Debt>,
	operationsByDebtId: Record<string, DebtOperation[]>,
	ratesCache: ExchangeRatesCache | null,
	displayCurrency: CurrencyCode,
): GlobalTotals {
	const owedToMeByCurrency: Partial<Record<CurrencyCode, number>> = {};
	const owedByMeByCurrency: Partial<Record<CurrencyCode, number>> = {};

	for (const debt of Object.values(debtsById)) {
		if (debt.status !== "active") continue;
		const balance = computeDebtBalance(debt, operationsByDebtId[debt.id] ?? []);
		if (balance <= 0) continue;
		const bucket = debt.direction === "owed_to_me" ? owedToMeByCurrency : owedByMeByCurrency;
		bucket[debt.currency] = roundAmount((bucket[debt.currency] ?? 0) + balance);
	}

	return {
		totalOwedToMeConverted: convertByCurrency(owedToMeByCurrency, ratesCache, displayCurrency),
		totalOwedByMeConverted: convertByCurrency(owedByMeByCurrency, ratesCache, displayCurrency),
		owedToMeByCurrency,
		owedByMeByCurrency,
	};
}
