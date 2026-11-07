import { useLocation, useNavigate } from "react-router-dom";
import type { BillLinkState } from "@/entities/debt";
import { CreationDraftGate, leaveCreationDraft } from "@/entities/debt";
import { BillForm } from "@/features/create-bill";
import { showDeleteCreationDraft } from "@/features/delete-creation-draft";

export function CreateBillPage() {
	const location = useLocation();
	const navigate = useNavigate();
	// «Отмена» — туда, откуда открыли форму (меню «+», онбординг); по прямой ссылке — на главную.
	const backTo = (location.state as { backTo?: string } | null)?.backTo ?? "/";
	const billState: BillLinkState = { from: "home" };

	const leave = () => navigate(backTo);
	const remove = () => {
		void showDeleteCreationDraft("bill", leave);
	};

	return (
		<div className="animate-in fade-in flex flex-1 flex-col duration-300">
			<CreationDraftGate kind="bill" onBack={leave} onDelete={remove}>
				<BillForm
					// После сохранения «назад» не возвращает в форму.
					onSaved={(billId) => navigate(`/bills/${billId}`, { replace: true, state: billState })}
					onCancel={() => {
						void leaveCreationDraft("bill", leave);
					}}
					onDelete={remove}
				/>
			</CreationDraftGate>
		</div>
	);
}
