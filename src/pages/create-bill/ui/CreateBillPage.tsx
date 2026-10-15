import { useLocation, useNavigate } from "react-router-dom";
import type { BillLinkState } from "@/entities/debt";
import { BillForm } from "@/features/create-bill";

export function CreateBillPage() {
	const location = useLocation();
	const navigate = useNavigate();
	// «Отмена» — туда, откуда открыли форму (меню «+», онбординг); по прямой ссылке — на главную.
	const backTo = (location.state as { backTo?: string } | null)?.backTo ?? "/";
	const billState: BillLinkState = { from: "home" };

	return (
		<div className="animate-in fade-in flex flex-1 flex-col duration-300">
			<BillForm
				// После сохранения «назад» не возвращает в форму.
				onSaved={(billId) => navigate(`/bills/${billId}`, { replace: true, state: billState })}
				onCancel={() => navigate(backTo)}
			/>
		</div>
	);
}
