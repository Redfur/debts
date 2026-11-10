import { useSyncExternalStore } from "react";
import { createLocalizationPreferences } from "./localization-preference-state";

let storage: Storage | undefined;
try {
	storage = globalThis.localStorage;
} catch {
	/* Настройки остаются в памяти сеанса. */
}

export const localizationPreferences = createLocalizationPreferences(storage, () => {
	if (typeof navigator === "undefined") return [];
	return navigator.languages?.length ? navigator.languages : navigator.language ? [navigator.language] : [];
});

if (typeof window !== "undefined") {
	window.addEventListener("languagechange", localizationPreferences.refreshSystemLanguage);
}

export function useLocalizationPreferences() {
	return useSyncExternalStore(
		localizationPreferences.subscribe,
		localizationPreferences.getSnapshot,
		localizationPreferences.getSnapshot,
	);
}
