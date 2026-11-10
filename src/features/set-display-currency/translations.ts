export const SET_DISPLAY_CURRENCY_NS = "set-display-currency";

export const setDisplayCurrencyTranslations = {
	en: {
		preferredLabel: "Preferred totals currency",
		preferredHint: "Always in quick selection. Selecting it also switches totals",
		currentLabel: "Current display currency",
		currentHint: "Used for totals now. Tap an amount on the home screen to change it",
	},
	ru: {
		preferredLabel: "Предпочитаемая валюта итогов",
		preferredHint: "Всегда в быстром выборе. При выборе переключает итоги",
		currentLabel: "Текущая валюта отображения",
		currentHint: "В ней сейчас показаны итоги. Меняется нажатием на сумму на главной",
	},
} as const;
