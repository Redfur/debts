import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { CreationDraftGate, leaveCreationDraft } from "@/entities/debt";
import { CreateDebtForm } from "@/features/create-debt";
import { showDeleteCreationDraft } from "@/features/delete-creation-draft";

export function CreateDebtPage() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const location = useLocation();
	const contactId = searchParams.get("contactId") ?? undefined;
	const backTo = (location.state as { backTo?: string } | null)?.backTo ?? (contactId ? `/contacts/${contactId}` : "/");

	const leave = () => navigate(backTo);
	const remove = () => {
		void showDeleteCreationDraft("debt", leave);
	};

	return (
		<div className="animate-in fade-in flex flex-1 flex-col duration-300">
			<CreationDraftGate kind="debt" onBack={leave} onDelete={remove}>
				<CreateDebtForm
					initialContactId={contactId}
					onSuccess={() => navigate(backTo)}
					onCancel={() => {
						void leaveCreationDraft("debt", leave);
					}}
					onDelete={remove}
				/>
			</CreationDraftGate>
		</div>
	);
}
