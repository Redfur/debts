import { type Bill, useDebtStore } from "@/entities/debt";
import { COMMON_NS } from "@/shared/i18n";
import { formatMoney } from "@/shared/lib/format-amount";
import { i18n } from "@/shared/lib/i18n";
import { showConfirmActionModal } from "@/shared/ui/modals";
import { DELETE_BILL_NS } from "../translations";

type Options = {
	bill: Bill;
	/** Открыто «Удалить» на долге из счёта — добавляется строка, что удалится весь счёт. */
	fromDebt?: boolean;
	onDeleted?: () => void;
};

/** Шторка «Удалить счёт?»: счёт удаляется вместе со всеми связанными долгами и их историей; контакты остаются. */
export function showDeleteBillConfirm({ bill, fromDebt, onDeleted }: Options) {
	const t = i18n.getFixedT(null, DELETE_BILL_NS);
	const tCommon = i18n.getFixedT(null, COMMON_NS);
	const { debtsById, deleteBill } = useDebtStore.getState();
	const count = Object.values(debtsById).filter((d) => d.billId === bill.id).length;
	const params = { title: bill.title ?? t("untitled"), amount: formatMoney(bill.totalAmount, bill.currency), count };
	return showConfirmActionModal({
		title: t("title"),
		lead: fromDebt ? t("fromDebt") : undefined,
		body: count > 0 ? t("bodyWithDebts", params) : t("bodyNoDebts", params),
		confirmLabel: tCommon("delete"),
		cancelLabel: tCommon("cancel"),
		confirmVariant: "destructive",
		onConfirm: async () => {
			if (await deleteBill(bill.id)) onDeleted?.();
		},
	});
}
