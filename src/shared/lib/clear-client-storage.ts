import { CLIENT_STORAGE_KEYS } from "@/shared/lib/client-storage-keys";
import { initTheme } from "@/shared/lib/theme";

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
}
