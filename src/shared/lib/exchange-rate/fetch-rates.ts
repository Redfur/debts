import { SUPPORTED_CURRENCIES } from "../../config/currencies.ts";
import type { CurrencyCode, ExchangeRatesCache } from "../storage/schema";

const BASE_CURRENCY: CurrencyCode = "USD";

/**
 * Бесплатный источник без ключа, ежедневное обновление, зеркала на jsDelivr/Cloudflare.
 * https://github.com/fawazahmed0/exchange-api
 */
const PRIMARY_URL = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${BASE_CURRENCY.toLowerCase()}.json`;
const FALLBACK_URL = `https://latest.currency-api.pages.dev/v1/currencies/${BASE_CURRENCY.toLowerCase()}.json`;

type CurrencyApiResponse = {
	date: string;
	[base: string]: unknown;
};

async function fetchFromUrl(url: string): Promise<CurrencyApiResponse> {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Currency API responded with ${response.status}`);
	}
	return (await response.json()) as CurrencyApiResponse;
}

/** Загружает свежие курсы к {@link BASE_CURRENCY}; бросает при недоступности сети/источника. */
export async function fetchExchangeRates(): Promise<ExchangeRatesCache> {
	let payload: CurrencyApiResponse;
	try {
		payload = await fetchFromUrl(PRIMARY_URL);
	} catch {
		payload = await fetchFromUrl(FALLBACK_URL);
	}

	const rawRates = payload[BASE_CURRENCY.toLowerCase()];
	if (!rawRates || typeof rawRates !== "object") {
		throw new Error("Unexpected currency API response shape");
	}

	const rates: Partial<Record<CurrencyCode, number>> = {};
	for (const code of SUPPORTED_CURRENCIES) {
		const value = (rawRates as Record<string, unknown>)[code.toLowerCase()];
		if (typeof value === "number" && Number.isFinite(value) && value > 0) rates[code] = value;
	}
	rates[BASE_CURRENCY] = 1;

	return {
		base: BASE_CURRENCY,
		date: payload.date,
		fetchedAt: new Date().toISOString(),
		rates,
	};
}
