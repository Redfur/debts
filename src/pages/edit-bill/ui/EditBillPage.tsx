import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useBillDebts, useDebtStore } from "@/entities/debt";
import { BillForm } from "@/features/create-bill";
import { BillDetailSkeleton, BillNotFound } from "@/widgets/bill-detail";

export function EditBillPage() {
	const { billId = "" } = useParams<{ billId: string }>();
	const location = useLocation();
	const navigate = useNavigate();
	const hydrated = useDebtStore((s) => s.hydrated);
	const bill = useDebtStore((s) => s.billsById[billId]);
	const debts = useBillDebts(billId);
	const operationsByDebtId = useDebtStore((s) => s.operationsByDebtId);

	if (!hydrated) return <BillDetailSkeleton />;
	if (!bill) return <BillNotFound />;

	const locked = debts.some((d) => (operationsByDebtId[d.id] ?? []).some((op) => op.kind === "repayment"));
	// Открыта с экрана счёта — вернуться назад по истории; по прямой ссылке — на экран счёта.
	const close = () => (location.key === "default" ? navigate(`/bills/${bill.id}`, { replace: true }) : navigate(-1));

	return (
		<div className="animate-in fade-in flex flex-1 flex-col duration-300">
			<BillForm bill={bill} locked={locked} onSaved={close} onCancel={close} />
		</div>
	);
}
