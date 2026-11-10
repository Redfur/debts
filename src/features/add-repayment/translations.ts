export const ADD_REPAYMENT_NS = "add-repayment";

export const addRepaymentTranslations = {
	en: {
		title: "Repayment",
		untitledDebt: "Debt",
		amountLabel: "Repayment amount",
		remaining: "Balance {{balance}} → <b>{{left}}</b> left",
		repayAll: "Repay in full",
		noteLabel: "Note · optional",
		notePlaceholder: "For example, bank transfer",
		errorAmountInvalid: "Enter an amount greater than zero",
		errorExceedsBalance: "Amount exceeds the remaining debt",
		errorGeneric: "Could not save. Please try again.",
	},
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
