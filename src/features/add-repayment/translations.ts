export const ADD_REPAYMENT_NS = "add-repayment";

export const addRepaymentTranslations = {
	ru: {
		title: "Погашение",
		untitledDebt: "Долг",
		amountLabel: "Сумма погашения",
		remaining: "Остаток {{balance}} →\u00a0останется <b>{{left}}</b>",
		repayAll: "Погасить полностью",
		noteLabel: "Заметка · необязательно",
		notePlaceholder: "Например, перевела на карту",
		errorAmountInvalid: "Введите сумму больше нуля",
		errorExceedsBalance: "Сумма больше остатка долга",
		errorGeneric: "Не удалось сохранить. Попробуйте ещё раз.",
	},
} as const;
