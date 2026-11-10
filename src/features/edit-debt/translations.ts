export const EDIT_DEBT_NS = "edit-debt";

export const editDebtTranslations = {
	en: {
		title: "Edit debt",
		directionLabel: "Direction",
		amountLabel: "Amount",
		currencyTitle: "Currency",
		currencyLabel: "Currency: {{name}}",
		noteLabel: "Note",
		notePlaceholder: "For example, taxi from the airport",
		lockedHint:
			"This debt already has repayments, so its direction, amount and currency cannot be changed. To correct them, delete the debt and record it again.",
		billHint: "This debt is part of the bill “{{title}}”. Change its amount and direction in the bill.",
		untitledBill: "Bill",
		openBill: "Open bill",
		errorAmountInvalid: "Enter an amount greater than zero",
		errorGeneric: "Could not save. Please try again.",
	},
	ru: {
		title: "Изменить долг",
		directionLabel: "Направление",
		amountLabel: "Сумма",
		currencyTitle: "Валюта",
		currencyLabel: "Валюта: {{name}}",
		noteLabel: "Заметка",
		notePlaceholder: "Например, такси из аэропорта",
		lockedHint:
			"По долгу уже есть погашения, поэтому направление, сумма и валюта не меняются. Чтобы исправить их, удалите долг и запишите заново.",
		billHint: "Этот долг — часть счёта «{{title}}». Сумма и направление меняются в счёте.",
		untitledBill: "Счёт",
		openBill: "Открыть счёт",
		errorAmountInvalid: "Введите сумму больше нуля",
		errorGeneric: "Не удалось сохранить. Попробуйте ещё раз.",
	},
} as const;
