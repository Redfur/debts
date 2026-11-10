export const CONTACTS_SCREEN_NS = "contacts-screen";

export const contactsScreenTranslations = {
	en: {
		title: "Contacts",
		empty: "No contacts yet.",
		searchLabel: "Search",
		searchPlaceholder: "Search by name",
		clearSearch: "Clear",
		notFound: "No matches for “{{query}}”",
		selectTitle: "Select a contact",
		selectHint: "Their debts and history will appear here.",
		loading: "Loading…",
	},
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
