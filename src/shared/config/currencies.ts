import type { CurrencyCode } from "@/shared/lib/storage";

export const SUPPORTED_CURRENCIES: readonly CurrencyCode[] = ["RUB", "USD", "EUR", "CNY"];

export const CURRENCY_SYMBOL: Record<CurrencyCode, string> = {
	RUB: "₽",
	USD: "$",
	EUR: "€",
	CNY: "¥",
};

export const CURRENCY_LABEL: Record<CurrencyCode, string> = {
	RUB: "Российский рубль",
	USD: "Доллар США",
	EUR: "Евро",
	CNY: "Китайский юань",
};

export function isSupportedCurrency(value: string): value is CurrencyCode {
	return (SUPPORTED_CURRENCIES as readonly string[]).includes(value);
}
