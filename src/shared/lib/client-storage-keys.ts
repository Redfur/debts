/** Единый список ключей client-side хранилища (для сброса и документации). */
export const CLIENT_STORAGE_KEYS = {
	theme: "app-theme",
	displayCurrency: "debts.displayCurrency",
} as const;

/** Служебные отметки интерфейса: «Сбросить настройки интерфейса» их не трогает, «Очистить всё» — удаляет. */
export const CLIENT_STATE_KEYS = {
	installBannerDismissed: "debts.installBannerDismissed",
} as const;
