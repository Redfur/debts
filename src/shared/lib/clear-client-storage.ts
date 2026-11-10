import { CLIENT_STATE_KEYS, CLIENT_STORAGE_KEYS } from "@/shared/lib/client-storage-keys";
import { notifyDisplayCurrencyReset } from "@/shared/lib/currency-preference";
import { initTheme } from "@/shared/lib/theme";
import { localizationPreferences } from "./localization-preference";

function removeKeys(keys: Record<string, string>): void {
	for (const key of Object.values(keys)) {
		try {
			localStorage.removeItem(key);
		} catch {
			/* ignore */
		}
	}
}

/** Удаляет известные ключи `localStorage` (тема, предпочтения приложения) и переинициализирует тему. */
export function clearClientStoragePreferences(): void {
	removeKeys(CLIENT_STORAGE_KEYS);
	initTheme();
	localizationPreferences.reset();
	notifyDisplayCurrencyReset();
}

/** «Очистить всё»: настройки интерфейса и служебные отметки (например, закрытая плашка установки). */
export function clearAllClientStorage(): void {
	removeKeys(CLIENT_STATE_KEYS);
	clearClientStoragePreferences();
}
