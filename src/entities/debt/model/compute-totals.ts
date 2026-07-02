import { convertAmount } from "@/shared/lib/exchange-rate";
import { roundAmount } from "@/shared/lib/round-amount";
import type { CurrencyCode, ExchangeRatesCache } from "@/shared/lib/storage";
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

	const sumConverted = (byCurrency: Partial<Record<CurrencyCode, number>>): number | null => {
		let total = 0;
		for (const [currency, amount] of Object.entries(byCurrency) as [CurrencyCode, number][]) {
			const converted = convertAmount(amount, currency, displayCurrency, ratesCache);
			if (converted === null) return null;
			total += converted;
		}
		return roundAmount(total);
	};

	return {
		totalOwedToMeConverted: sumConverted(owedToMeByCurrency),
		totalOwedByMeConverted: sumConverted(owedByMeByCurrency),
		owedToMeByCurrency,
		owedByMeByCurrency,
	};
}
