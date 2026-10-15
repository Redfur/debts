export const HOME_SCREEN_NS = "homeScreen";

export const homeScreenTranslations = {
	ru: {
		title: "Долги",
		amountA11y: "{{label}} {{amount}}. Показать в другой валюте",
		noRateA11y: "Сумма недоступна без курса",
		noRateNotice: "Нет сети — курс ещё не загружен, поэтому итог не посчитать",
		retry: "Повторить",
		difference: "Разница",
		filterLabel: "Фильтр",
		filterAll: "Все",
		openDebts: "Открытые долги",
		allSettled: "Открытых долгов нет — всё погашено",
		colContact: "Контакт",
		colOpenDebts: "Открытых долгов",
		emptyTitle: "Пока никто никому не должен",
		emptyBody: "Запишите первый долг — например, кто вам должен за такси. Всё хранится только на этом устройстве.",
		emptyAdd: "Добавить первый долг",
		emptyRestore: "Восстановить из резервной копии",
		loading: "Загрузка…",
	},
} as const;
