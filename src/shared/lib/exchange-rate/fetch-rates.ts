import { SUPPORTED_CURRENCIES } from "@/shared/config/currencies";
import type { CurrencyCode, ExchangeRatesCache } from "@/shared/lib/storage";

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
	return response.json();
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

	const rates = {} as Record<CurrencyCode, number>;
	for (const code of SUPPORTED_CURRENCIES) {
		const value = (rawRates as Record<string, unknown>)[code.toLowerCase()];
		rates[code] = typeof value === "number" ? value : code === BASE_CURRENCY ? 1 : Number.NaN;
	}

	return {
		base: BASE_CURRENCY,
		date: payload.date,
		fetchedAt: new Date().toISOString(),
		rates,
	};
}
