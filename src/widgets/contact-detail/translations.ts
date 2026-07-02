export const CONTACT_DETAIL_NS = "contact-detail";

export const contactDetailTranslations = {
	ru: {
		backToHome: "На главную",
		notFoundTitle: "Контакт не найден",
		notFoundBody: "Возможно, он был удалён вместе с последним долгом.",
		owedToMeTitle: "Должен вам",
		owedByMeTitle: "Вы должны",
		addDebtAction: "Добавить долг",
		debtsSectionTitle: "Долги",
		emptyDebts: "У этого контакта пока нет долгов.",
		statusClosed: "Погашен",
		balanceLine: "Остаток: {{amount}} из {{principal}}",
		repayAction: "Погасить",
		deleteDebtConfirmTitle: "Удалить долг?",
		deleteDebtConfirmBody: "Долг и вся история операций по нему будут удалены без возможности восстановления.",
		historyTitle: "История",
		operationInitial: "Создание долга",
		operationRepayment: "Погашение",
	},
} as const;
