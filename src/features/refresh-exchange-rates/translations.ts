export const REFRESH_RATES_NS = "refresh-exchange-rates";

export const refreshExchangeRatesTranslations = {
	en: {
		label: "Exchange rates",
		statusUpdated: "Updated {{moment}}",
		statusMissing: "Not loaded yet",
		statusOffline: "Offline · rates from {{date}}",
		statusFailed: "Could not update",
		refresh: "Refresh",
		retry: "Retry",
	},
	ru: {
		label: "Курс валют",
		statusUpdated: "Обновлён {{moment}}",
		statusMissing: "Ещё не загружен",
		statusOffline: "Нет сети · курс от {{date}}",
		statusFailed: "Не удалось обновить",
		refresh: "Обновить",
		retry: "Повторить",
	},
} as const;
