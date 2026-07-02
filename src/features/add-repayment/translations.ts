export const ADD_REPAYMENT_NS = "add-repayment";

export const addRepaymentTranslations = {
	ru: {
		title: "Погашение долга",
		balanceLine: "Остаток: {{amount}} {{symbol}}",
		amountLabel: "Сумма погашения",
		noteLabel: "Заметка (необязательно)",
		errorAmountInvalid: "Введите сумму больше нуля",
		errorExceedsBalance: "Сумма больше остатка долга",
		errorGeneric: "Не удалось сохранить. Попробуйте ещё раз.",
	},
} as const;
