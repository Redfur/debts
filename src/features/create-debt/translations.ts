export const CREATE_DEBT_NS = "create-debt";

export const createDebtTranslations = {
	en: {
		title: "New debt",
		createDebt: "Create debt",
		directionLabel: "Direction",
		hintOwedToMe: "{{name}} will pay you back",
		hintIOwe: "{{name}} is waiting for your repayment",
		amountLabel: "Amount",
		currencyTitle: "Currency",
		currencyLabel: "Currency: {{name}}",
		noteLabel: "Note · optional",
		notePlaceholder: "For example, taxi from the airport",
		errorContactRequired: "Select or create a contact",
		errorAmountInvalid: "Enter an amount greater than zero",
		errorGeneric: "Could not save. Please try again.",
	},
	ru: {
		title: "Новый долг",
		createDebt: "Создать долг",
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
