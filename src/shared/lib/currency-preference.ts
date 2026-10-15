import { useEffect, useState } from "react";
import { isSupportedCurrency } from "@/shared/config/currencies";
import { CLIENT_STORAGE_KEYS } from "@/shared/lib/client-storage-keys";
import type { CurrencyCode } from "@/shared/lib/storage";

const DEFAULT_DISPLAY_CURRENCY: CurrencyCode = "RUB";

const DISPLAY_CURRENCY_CHANGE_EVENT = "app-display-currency-change";

type DisplayCurrencyChangeDetail = {
	currency: CurrencyCode;
};

function getDisplayCurrency(): CurrencyCode {
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

/** Сообщает подписчикам, что сохранённая валюта сброшена к значению по умолчанию. */
export function notifyDisplayCurrencyReset(): void {
	if (typeof window === "undefined") return;
	window.dispatchEvent(
		new CustomEvent<DisplayCurrencyChangeDetail>(DISPLAY_CURRENCY_CHANGE_EVENT, {
			detail: { currency: DEFAULT_DISPLAY_CURRENCY },
		}),
	);
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
