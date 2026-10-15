export const CREATE_DEBT_NS = "create-debt";

export const createDebtTranslations = {
	ru: {
		title: "Новый долг",
		contactLabel: "Контакт",
		directionLabel: "Направление",
		amountLabel: "Сумма",
		currencyLabel: "Валюта",
		noteLabel: "Заметка (необязательно)",
		errorContactRequired: "Выберите или создайте контакт",
		errorAmountInvalid: "Введите сумму больше нуля",
		errorGeneric: "Не удалось сохранить. Попробуйте ещё раз.",
	},
} as const;
