import { useLocation, useParams } from "react-router-dom";
import { type BillLinkState, useDebtStore } from "@/entities/debt";
import { BillDetailScreen, BillDetailSkeleton, BillNotFound } from "@/widgets/bill-detail";

export function BillDetailPage() {
	const { billId = "" } = useParams<{ billId: string }>();
	const location = useLocation();
	const hydrated = useDebtStore((s) => s.hydrated);
	const bill = useDebtStore((s) => s.billsById[billId]);

	if (!hydrated) return <BillDetailSkeleton />;
	if (!bill) return <BillNotFound />;

	// «Назад» — туда, откуда открыли (главная или карточка контакта); по прямой ссылке — на главную.
	const from = location.state as BillLinkState | null;
	const backTo = from?.from === "contact" ? `/contacts/${from.contactId}` : "/";
	return <BillDetailScreen bill={bill} backTo={backTo} />;
}
