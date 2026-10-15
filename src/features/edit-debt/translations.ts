export const EDIT_DEBT_NS = "edit-debt";

export const editDebtTranslations = {
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
