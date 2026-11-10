export const DELETE_BILL_NS = "delete-bill";

export const deleteBillTranslations = {
	en: {
		title: "Delete bill?",
		fromDebt: "This debt is part of a bill, so the entire bill will be deleted.",
		bodyWithDebts_one:
			"“{{title}}” for {{amount}} and {{count}} linked debt with its repayment history will be deleted. This cannot be undone.",
		bodyWithDebts_other:
			"“{{title}}” for {{amount}} and {{count}} linked debts with their repayment history will be deleted. This cannot be undone.",
		bodyNoDebts: "“{{title}}” for {{amount}} will be deleted. This cannot be undone.",
		untitled: "Bill",
	},
	ru: {
		title: "Удалить счёт?",
		fromDebt: "Этот долг — часть счёта, поэтому удалится весь счёт.",
		bodyWithDebts_one:
			"«{{title}}» на {{amount}} и {{count}} связанный долг с историей погашений удалятся. Отменить это нельзя.",
		bodyWithDebts_few:
			"«{{title}}» на {{amount}} и {{count}} связанных долга с историей погашений удалятся. Отменить это нельзя.",
		bodyWithDebts_many:
			"«{{title}}» на {{amount}} и {{count}} связанных долгов с историей погашений удалятся. Отменить это нельзя.",
		bodyNoDebts: "«{{title}}» на {{amount}} удалится. Отменить это нельзя.",
		untitled: "Счёт",
	},
} as const;
