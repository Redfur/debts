import type { AppLanguage } from "../lib/localization-preference-state.ts";
import { CURRENCIES, type CurrencyCode, ENGLISH_CURRENCY_NAMES } from "./currency-catalog.ts";

export const SUPPORTED_CURRENCIES = Object.keys(CURRENCIES) as CurrencyCode[];

function currencyProperty(property: "label" | "shortLabel" | "symbol"): Record<CurrencyCode, string> {
	return Object.fromEntries(SUPPORTED_CURRENCIES.map((code) => [code, CURRENCIES[code][property]])) as Record<
		CurrencyCode,
		string
	>;
}

const CURRENCY_LABEL = currencyProperty("label");
const CURRENCY_SHORT_LABEL = currencyProperty("shortLabel");
export const CURRENCY_SYMBOL = currencyProperty("symbol");

const englishShortLabels: Record<CurrencyCode, string> = {
	...ENGLISH_CURRENCY_NAMES,
	RUB: "Ruble",
	USD: "Dollar",
	CNY: "Yuan",
	GBP: "Pound",
	GEL: "Lari",
	JPY: "Yen",
	KZT: "Tenge",
	THB: "Baht",
	TRY: "Lira",
	VED: "Bolívar",
	XCG: "Guilder",
	ZWG: "Gold",
};

export function currencyLabels(language: AppLanguage, short = false): Record<CurrencyCode, string> {
	return language === "en"
		? short
			? englishShortLabels
			: ENGLISH_CURRENCY_NAMES
		: short
			? CURRENCY_SHORT_LABEL
			: CURRENCY_LABEL;
}

export function isSupportedCurrency(value: unknown): value is CurrencyCode {
	return typeof value === "string" && Object.hasOwn(CURRENCIES, value);
}

/** Соответствие фактической локали интерфейса; новые языки добавляются явно. */
export function localeCurrency(locale: string): CurrencyCode {
	return locale.toLowerCase().split("-")[0] === "en" ? "USD" : "RUB";
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

const alphabeticalCurrencies = Object.fromEntries(
	(["ru", "en"] as const).map((language) => {
		const byName = new Intl.Collator(language);
		const labels = currencyLabels(language);
		return [
			language,
			[...SUPPORTED_CURRENCIES].sort((a, b) => byName.compare(labels[a], labels[b]) || a.localeCompare(b)),
		];
	}),
) as Record<AppLanguage, CurrencyCode[]>;

export function currencyGroups(top: readonly CurrencyCode[], query: string, language: AppLanguage = "ru") {
	const uniqueTop = [...new Set(top)];
	const topSet = new Set(uniqueTop);
	const search = query.trim().toLocaleLowerCase(language);
	const labels = currencyLabels(language);
	const matches = (code: CurrencyCode) =>
		code.toLowerCase().includes(search) || labels[code].toLocaleLowerCase(language).includes(search);
	return {
		top: uniqueTop.filter(matches),
		other: alphabeticalCurrencies[language].filter((code) => !topSet.has(code) && matches(code)),
	};
}
