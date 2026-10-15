export const CONTACT_DETAIL_NS = "contact-detail";

export const contactDetailTranslations = {
	ru: {
		backToHome: "На главную",
		notFoundTitle: "Контакт не найден",
		notFoundBody:
			"Такого контакта нет на этом устройстве. Возможно, ссылка устарела или данные были очищены либо заменены резервной копией.",
		addDebtAction: "Добавить долг",
		debtsSectionTitle: "Долги",
		emptyDebts: "У этого контакта пока нет долгов.",
		balanceLine: "Остаток: {{amount}} из {{principal}}",
		repayAction: "Погасить",
		deleteDebtConfirmTitle: "Удалить долг?",
		deleteDebtConfirmBody: "Долг и вся история операций по нему будут удалены без возможности восстановления.",
		historyShow: "Показать историю ({{count}})",
		historyHide: "Скрыть историю",
		operationInitial: "Создание долга",
		operationRepayment: "Погашение",
	},
} as const;
