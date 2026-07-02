export const EDIT_DEBT_NS = "edit-debt";

export const editDebtTranslations = {
	ru: {
		title: "Изменить долг",
		directionLabel: "Направление",
		directionOwedToMe: "Мне должны",
		directionIOwe: "Я должен",
		amountLabel: "Сумма",
		currencyLabel: "Валюта",
		noteLabel: "Заметка (необязательно)",
		lockedHint: "Сумму, направление и валюту нельзя изменить — по долгу уже есть погашения.",
		errorAmountInvalid: "Введите сумму больше нуля",
		errorGeneric: "Не удалось сохранить. Попробуйте ещё раз.",
	},
} as const;
