export const CONTACT_DETAIL_NS = "contact-detail";

export const contactDetailTranslations = {
	ru: {
		backToHome: "На главную",
		notFoundTitle: "Контакт не найден",
		notFoundBody:
			"Такого контакта нет на этом устройстве. Возможно, ссылка устарела или данные были очищены либо заменены резервной копией.",
		addDebtAction: "Добавить долг",
		difference: "Разница",
		noRateA11y: "Сумма недоступна без курса",
		sectionOpen: "Открытые",
		sectionClosed: "Погашенные",
		emptyDebts: "У этого контакта пока нет долгов.",
		untitledDebt: "Долг",
		balance: "Остаток",
		ofPrincipal: "из {{amount}}",
		progressA11y: "Возвращено {{repaid}} из {{principal}}",
		progressNoneA11y: "Ещё ничего не возвращено",
		repayAction: "Погасить",
		history_one: "История · {{count}} операция",
		history_few: "История · {{count}} операции",
		history_many: "История · {{count}} операций",
		history_other: "История · {{count}} операции",
		operationInitial: "Создание долга",
		operationRepayment: "Погашение",
		deleteDebtConfirmTitle: "Удалить долг?",
		deleteDebtConfirmBodyNote: "«{{note}}» на {{amount}} и вся его история погашений удалятся. Отменить это нельзя.",
		deleteDebtConfirmBody: "Долг на {{amount}} и вся его история погашений удалятся. Отменить это нельзя.",
		loading: "Загрузка…",
	},
} as const;
