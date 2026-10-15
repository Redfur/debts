export const DELETE_BILL_NS = "delete-bill";

export const deleteBillTranslations = {
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
