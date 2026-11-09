import { CURRENCIES, type CurrencyCode } from "./currency-catalog.ts";

export const SUPPORTED_CURRENCIES = Object.keys(CURRENCIES) as CurrencyCode[];

function currencyProperty(property: "label" | "shortLabel" | "symbol"): Record<CurrencyCode, string> {
	return Object.fromEntries(SUPPORTED_CURRENCIES.map((code) => [code, CURRENCIES[code][property]])) as Record<
		CurrencyCode,
		string
	>;
}

export const CURRENCY_LABEL = currencyProperty("label");
export const CURRENCY_SHORT_LABEL = currencyProperty("shortLabel");
export const CURRENCY_SYMBOL = currencyProperty("symbol");

export function isSupportedCurrency(value: unknown): value is CurrencyCode {
	return typeof value === "string" && Object.hasOwn(CURRENCIES, value);
}

/** Соответствие фактической локали интерфейса; новые языки добавляются явно. */
export function localeCurrency(locale: string): CurrencyCode {
	const currencies: Record<string, CurrencyCode> = { ru: "RUB", "ru-RU": "RUB" };
	return currencies[locale] ?? currencies.ru;
}

/** Общий порядок для верхней группы и круга; состав использованных валют задаёт вызывающий код. */
export function prioritizedCurrencies(
	used: readonly CurrencyCode[],
	preferred: CurrencyCode,
	locale: CurrencyCode,
): CurrencyCode[] {
	return [...new Set([locale, preferred, "USD" as const, ...[...used].sort()])];
}

export function nextSupportedCurrency(current: CurrencyCode, cycle: readonly CurrencyCode[]): CurrencyCode {
	return cycle[(cycle.indexOf(current) + 1) % cycle.length] ?? current;
}

const byName = new Intl.Collator("ru");
const alphabeticalCurrencies = [...SUPPORTED_CURRENCIES].sort(
	(a, b) => byName.compare(CURRENCY_LABEL[a], CURRENCY_LABEL[b]) || a.localeCompare(b),
);

export function currencyGroups(top: readonly CurrencyCode[], query: string) {
	const uniqueTop = [...new Set(top)];
	const topSet = new Set(uniqueTop);
	const search = query.trim().toLocaleLowerCase("ru");
	const matches = (code: CurrencyCode) =>
		code.toLowerCase().includes(search) || CURRENCY_LABEL[code].toLocaleLowerCase("ru").includes(search);
	return {
		top: uniqueTop.filter(matches),
		other: alphabeticalCurrencies.filter((code) => !topSet.has(code) && matches(code)),
	};
}
