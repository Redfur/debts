import type { CurrencyCode, ExchangeRatesCache } from "@/shared/lib/storage";

/** Конвертирует сумму между валютами через `ratesCache.base`; null — курса нет или он некорректен. */
export function convertAmount(
	amount: number,
	from: CurrencyCode,
	to: CurrencyCode,
	ratesCache: ExchangeRatesCache | null,
): number | null {
	if (from === to) return amount;
	if (!ratesCache) return null;

	const rateFrom = ratesCache.rates[from];
	const rateTo = ratesCache.rates[to];
	if (!Number.isFinite(rateFrom) || !rateFrom || !Number.isFinite(rateTo)) return null;

	const amountInBase = amount / rateFrom;
	return amountInBase * rateTo;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** Курс считается устаревшим, если дата от источника отличается от сегодняшней или прошло больше суток. */
export function isRatesCacheStale(ratesCache: ExchangeRatesCache | null, now: Date): boolean {
	if (!ratesCache) return true;
	const todayKey = now.toISOString().slice(0, 10);
	if (ratesCache.date !== todayKey) return true;
	const fetchedAt = new Date(ratesCache.fetchedAt).getTime();
	return Number.isNaN(fetchedAt) || now.getTime() - fetchedAt > ONE_DAY_MS;
}
