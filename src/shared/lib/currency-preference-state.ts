import { isSupportedCurrency } from "../config/currencies.ts";
import type { CurrencyCode } from "../config/currency-catalog.ts";
import { CLIENT_STORAGE_KEYS } from "./client-storage-keys.ts";

interface CurrencyPreferences {
	preferred: CurrencyCode;
	current: CurrencyCode;
}

/** Один снимок на обе настройки; хранилище необязательно (например, в приватном режиме). */
export function createCurrencyPreferences(
	storage: Pick<Storage, "getItem" | "setItem"> | undefined,
	fallback: CurrencyCode,
) {
	const listeners = new Set<() => void>();
	const read = (key: string) => {
		try {
			return storage?.getItem(key);
		} catch {
			return null;
		}
	};
	const write = (key: string, value: CurrencyCode) => {
		try {
			storage?.setItem(key, value);
		} catch {
			/* Настройки продолжают работать в памяти сеанса. */
		}
	};
	const oldCurrent = read(CLIENT_STORAGE_KEYS.displayCurrency);
	const storedPreferred = read(CLIENT_STORAGE_KEYS.preferredDisplayCurrency);
	const preferred = isSupportedCurrency(storedPreferred)
		? storedPreferred
		: isSupportedCurrency(oldCurrent)
			? oldCurrent
			: fallback;
	let snapshot: CurrencyPreferences = { preferred, current: isSupportedCurrency(oldCurrent) ? oldCurrent : preferred };
	// Инициализация до первого переключения: текущая больше не становится источником предпочтения.
	if (!isSupportedCurrency(storedPreferred)) write(CLIENT_STORAGE_KEYS.preferredDisplayCurrency, preferred);
	const publish = (next: CurrencyPreferences) => {
		snapshot = next;
		for (const listener of listeners) listener();
	};
	return {
		getSnapshot: () => snapshot,
		subscribe(listener: () => void) {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		setCurrent(currency: CurrencyCode) {
			write(CLIENT_STORAGE_KEYS.displayCurrency, currency);
			publish({ ...snapshot, current: currency });
		},
		setPreferred(currency: CurrencyCode) {
			write(CLIENT_STORAGE_KEYS.preferredDisplayCurrency, currency);
			write(CLIENT_STORAGE_KEYS.displayCurrency, currency);
			publish({ preferred: currency, current: currency });
		},
		reset(currency: CurrencyCode) {
			publish({ preferred: currency, current: currency });
		},
	};
}
