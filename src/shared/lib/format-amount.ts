import { CURRENCY_SYMBOL } from "@/shared/config/currencies";
import type { CurrencyCode } from "@/shared/lib/storage";

const formatter = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });

/** Неразрывный пробел между числом и символом валюты: сумма не переносится на две строки. */
const NBSP = " ";

/** Форматирует денежную сумму для отображения (разделители разрядов, до 2 знаков после запятой). */
export function formatAmount(value: number): string {
	return formatter.format(value);
}

/** «10 000 ₽» — сумма с символом валюты, неразрывно. */
export function formatMoney(value: number, currency: CurrencyCode): string {
	return `${formatAmount(value)}${NBSP}${CURRENCY_SYMBOL[currency]}`;
}

/** «10 000 ₽ + 250 $» — остатки по валютам одной строкой; пустой набор → `null`. */
export function formatMoneyBreakdown(byCurrency: Partial<Record<CurrencyCode, number>>): string | null {
	const entries = Object.entries(byCurrency) as [CurrencyCode, number][];
	if (entries.length === 0) return null;
	return entries.map(([code, amount]) => formatMoney(amount, code)).join(" + ");
}
