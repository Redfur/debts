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

/** Следующая поддерживаемая валюта по кругу (₽ → $ → € → ¥ → ₽). */
export function nextSupportedCurrency(current: CurrencyCode): CurrencyCode {
	const index = SUPPORTED_CURRENCIES.indexOf(current);
	return SUPPORTED_CURRENCIES[(index + 1) % SUPPORTED_CURRENCIES.length];
}
