import { CLIENT_STORAGE_KEYS } from "@/shared/lib/client-storage-keys";
import { initTheme } from "@/shared/lib/theme";

/** Диспатчится после `clearClientStoragePreferences`; UI может сбросить локальные черновики. */
export const CLIENT_STORAGE_CLEARED_EVENT = "app-client-storage-cleared";

/** Удаляет известные ключи `localStorage` (тема, предпочтения приложения) и переинициализирует тему. */
export function clearClientStoragePreferences(): void {
	if (typeof localStorage === "undefined") return;
	for (const key of Object.values(CLIENT_STORAGE_KEYS)) {
		try {
			localStorage.removeItem(key);
		} catch {
			/* ignore */
		}
	}
	initTheme();
	if (typeof window !== "undefined") {
		window.dispatchEvent(new CustomEvent(CLIENT_STORAGE_CLEARED_EVENT));
	}
}
