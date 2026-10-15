import { convertAmount } from "@/shared/lib/exchange-rate";
import { roundAmount } from "@/shared/lib/round-amount";
import type { CurrencyCode, ExchangeRatesCache } from "@/shared/lib/storage";
import { computeContactSummary } from "./compute-contact-summary";
import type { ContactTotals, Debt, DebtOperation, DirectionTotal } from "./types";

/** Сумма по валютам в валюте итогов; `null`, если хотя бы одну валюту нельзя сконвертировать. */
export function convertByCurrency(
	byCurrency: Partial<Record<CurrencyCode, number>>,
	ratesCache: ExchangeRatesCache | null,
	displayCurrency: CurrencyCode,
): number | null {
	let total = 0;
	for (const [currency, amount] of Object.entries(byCurrency) as [CurrencyCode, number][]) {
		const converted = convertAmount(amount, currency, displayCurrency, ratesCache);
		if (converted === null) return null;
		total += converted;
	}
	return roundAmount(total);
}

function directionTotal(
	byCurrency: Partial<Record<CurrencyCode, number>>,
	ratesCache: ExchangeRatesCache | null,
	displayCurrency: CurrencyCode,
): DirectionTotal {
	return { converted: convertByCurrency(byCurrency, ratesCache, displayCurrency), byCurrency };
}

/** Сводка контакта: остатки активных долгов по направлениям в валюте итогов + разбивка + наличие долгов. */
export function computeContactTotals(
	contactId: string,
	debtsById: Record<string, Debt>,
	operationsByDebtId: Record<string, DebtOperation[]>,
	ratesCache: ExchangeRatesCache | null,
	displayCurrency: CurrencyCode,
): ContactTotals {
	const summary = computeContactSummary(contactId, debtsById, operationsByDebtId);
	let hasActive = false;
	let hasClosed = false;
	for (const debt of Object.values(debtsById)) {
		if (debt.contactId !== contactId) continue;
		if (debt.status === "active") hasActive = true;
		else hasClosed = true;
	}
	return {
		owedToMe: directionTotal(summary.owedToMeByCurrency, ratesCache, displayCurrency),
		owedByMe: directionTotal(summary.owedByMeByCurrency, ratesCache, displayCurrency),
		hasActive,
		hasClosed,
	};
}
