export const REFRESH_RATES_NS = "refresh-exchange-rates";

export const refreshExchangeRatesTranslations = {
	ru: {
		statusUpdated: "Обновлён {{date}}",
		statusMissing: "Ещё не загружен",
		statusError: "Не удалось обновить курс. Используется последний известный.",
		refreshAction: "Обновить курс",
	},
} as const;
