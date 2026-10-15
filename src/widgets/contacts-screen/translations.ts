export const CONTACTS_SCREEN_NS = "contacts-screen";

export const contactsScreenTranslations = {
	ru: {
		title: "Контакты",
		empty: "Пока нет ни одного контакта.",
		searchLabel: "Поиск",
		searchPlaceholder: "Поиск по имени",
		clearSearch: "Очистить",
		notFound: "Никого не нашли по «{{query}}»",
		selectTitle: "Выберите контакт",
		selectHint: "Его долги и история появятся здесь.",
		loading: "Загрузка…",
	},
} as const;
