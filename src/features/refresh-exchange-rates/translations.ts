export const REFRESH_RATES_NS = "refresh-exchange-rates";

export const refreshExchangeRatesTranslations = {
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
