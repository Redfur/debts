import { useSyncExternalStore } from "react";
import { localeCurrency } from "@/shared/config/currencies";
import type { CurrencyCode } from "@/shared/lib/storage";
import { createCurrencyPreferences } from "./currency-preference-state";
import { i18n } from "./i18n";

let preferences: ReturnType<typeof createCurrencyPreferences> | undefined;
function getPreferences() {
	if (!preferences) {
		let storage: Storage | undefined;
		try {
			storage = globalThis.localStorage;
		} catch {
			/* Хранилище может быть недоступно. */
		}
		preferences = createCurrencyPreferences(storage, localeCurrency(i18n.resolvedLanguage ?? i18n.language));
	}
	return preferences;
}

export function setDisplayCurrency(currency: CurrencyCode): void {
	getPreferences().setCurrent(currency);
}

export function setPreferredDisplayCurrency(currency: CurrencyCode): void {
	getPreferences().setPreferred(currency);
}

export function notifyDisplayCurrencyReset(): void {
	getPreferences().reset(localeCurrency(i18n.resolvedLanguage ?? i18n.language));
}

export function useCurrencyPreferences() {
	const store = getPreferences();
	return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}

/** Общая валюта всех сводок; переключение не меняет постоянное предпочтение. */
export function useDisplayCurrency(): CurrencyCode {
	return useCurrencyPreferences().current;
}
