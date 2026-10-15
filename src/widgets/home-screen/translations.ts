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
		allSettledHint: "Погашенные долги — в карточках контактов",
		noDebtsOnlyBills: "Долгов пока нет. В счетах ниже вас нет, поэтому итоги не меняются.",
		bills: "Счета",
		billsClosed: "Закрытые",
		colContact: "Контакт",
		colOpenDebts: "Открытых долгов",
		emptyTitle: "Пока никто никому не должен",
		emptyBody:
			"Запишите первый долг — например, кто вам должен за такси. Или разделите общий счёт на компанию. Всё хранится только на этом устройстве.",
		emptyAdd: "Добавить первый долг",
		emptySplit: "Разделить счёт",
		emptyRestore: "Восстановить из резервной копии",
		loading: "Загрузка…",
	},
} as const;
