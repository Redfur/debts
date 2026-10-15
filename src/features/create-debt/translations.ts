export const CREATE_DEBT_NS = "create-debt";

export const createDebtTranslations = {
	ru: {
		title: "Новый долг",
		directionLabel: "Направление",
		hintOwedToMe: "{{name}} вернёт деньги вам",
		hintIOwe: "{{name}} ждёт деньги от вас",
		amountLabel: "Сумма",
		currencyTitle: "Валюта",
		currencyLabel: "Валюта: {{name}}",
		noteLabel: "Заметка · необязательно",
		notePlaceholder: "Например, такси из аэропорта",
		errorContactRequired: "Выберите или создайте контакт",
		errorAmountInvalid: "Введите сумму больше нуля",
		errorGeneric: "Не удалось сохранить. Попробуйте ещё раз.",
	},
} as const;
