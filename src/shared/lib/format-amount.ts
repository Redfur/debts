import { CURRENCY_SYMBOL } from "@/shared/config/currencies";
import type { CurrencyCode } from "@/shared/lib/storage";
import { localizationPreferences } from "./localization-preference";
import type { NumberFormat } from "./localization-preference-state";
import { formatNumber } from "./number-format";

/** Неразрывный пробел между числом и символом валюты: сумма не переносится на две строки. */
const NBSP = " ";

/** Форматирует денежную сумму для отображения (разделители разрядов, до 2 знаков после запятой). */
export function formatAmount(
	value: number,
	format: NumberFormat = localizationPreferences.getSnapshot().numberFormat,
): string {
	return formatNumber(value, format);
}

/** «10 000 ₽» — сумма с символом валюты, неразрывно. */
export function formatMoney(
	value: number,
	currency: CurrencyCode,
	format: NumberFormat = localizationPreferences.getSnapshot().numberFormat,
): string {
	return `${formatAmount(value, format).replaceAll(" ", NBSP)}${NBSP}${CURRENCY_SYMBOL[currency]}`;
}

/** «10 000 ₽ + 250 $» — остатки по валютам одной строкой; пустой набор → `null`. */
export function formatMoneyBreakdown(
	byCurrency: Partial<Record<CurrencyCode, number>>,
	format: NumberFormat = localizationPreferences.getSnapshot().numberFormat,
): string | null {
	const entries = Object.entries(byCurrency) as [CurrencyCode, number][];
	if (entries.length === 0) return null;
	return entries.map(([code, amount]) => formatMoney(amount, code, format)).join(" + ");
}
