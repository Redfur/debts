export const SELECT_CONTACT_NS = "select-contact";

export const selectContactTranslations = {
	ru: {
		label: "Контакт",
		searchPlaceholder: "Имя или поиск",
		newContactPlaceholder: "Имя нового контакта",
		listLabel: "Контакты",
		clear: "Очистить",
		change: "Выбрать другой контакт",
		notFound: "Среди ваших контактов нет «{{query}}»",
		createNew: "Создать «{{name}}»",
		createHint: "Новый контакт сразу выберется",
		emptyTitle: "Контактов пока нет",
		emptyHint: "Введите имя — контакт создастся вместе с долгом",
		participantsTitle: "Участники",
		selectedCount: "Отмечены · {{count}}",
		selectedMeHint: "· вы уже в счёте",
		unselect: "Снять отметку: {{name}}",
		participantsSearch: "Найти или создать контакт",
		createHintMulti: "Новый контакт сразу отметится",
		done: "Готово ({{count}})",
	},
} as const;
