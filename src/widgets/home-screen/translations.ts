export const HOME_SCREEN_NS = "homeScreen";

export const homeScreenTranslations = {
	ru: {
		title: "Долги",
		owedToMeTitle: "Мне должны",
		owedByMeTitle: "Я должен",
		contactsSectionTitle: "Контакты",
		addDebtAction: "Добавить долг",
		emptyContacts: "Пока нет ни одного долга. Добавьте первый.",
		owedToMeLine: "Вам должны: {{amount}}",
		owedByMeLine: "Вы должны: {{amount}}",
	},
} as const;
