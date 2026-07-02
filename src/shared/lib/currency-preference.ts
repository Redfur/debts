import { useEffect, useState } from "react";
import { isSupportedCurrency } from "@/shared/config/currencies";
import { CLIENT_STORAGE_KEYS } from "@/shared/lib/client-storage-keys";
import type { CurrencyCode } from "@/shared/lib/storage";

const DEFAULT_DISPLAY_CURRENCY: CurrencyCode = "RUB";

export const DISPLAY_CURRENCY_CHANGE_EVENT = "app-display-currency-change";

export type DisplayCurrencyChangeDetail = {
	currency: CurrencyCode;
};

export function getDisplayCurrency(): CurrencyCode {
	if (typeof localStorage === "undefined") return DEFAULT_DISPLAY_CURRENCY;
	try {
		const stored = localStorage.getItem(CLIENT_STORAGE_KEYS.displayCurrency);
		if (stored && isSupportedCurrency(stored)) return stored;
	} catch {
		/* ignore */
	}
	return DEFAULT_DISPLAY_CURRENCY;
}

export function setDisplayCurrency(currency: CurrencyCode): void {
	try {
		localStorage.setItem(CLIENT_STORAGE_KEYS.displayCurrency, currency);
	} catch {
		/* ignore */
	}
	if (typeof window !== "undefined") {
		window.dispatchEvent(
			new CustomEvent<DisplayCurrencyChangeDetail>(DISPLAY_CURRENCY_CHANGE_EVENT, { detail: { currency } }),
		);
	}
}

/** Валюта отображения агрегатов с подпиской на изменение в других частях приложения. */
export function useDisplayCurrency(): CurrencyCode {
	const [currency, setCurrency] = useState<CurrencyCode>(() => getDisplayCurrency());

	useEffect(() => {
		const onChange = (e: Event) => {
			const ce = e as CustomEvent<DisplayCurrencyChangeDetail>;
			if (ce.detail?.currency) setCurrency(ce.detail.currency);
		};
		window.addEventListener(DISPLAY_CURRENCY_CHANGE_EVENT, onChange);
		return () => window.removeEventListener(DISPLAY_CURRENCY_CHANGE_EVENT, onChange);
	}, []);

	return currency;
}
