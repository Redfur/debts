import { useNavigate, useSearchParams } from "react-router-dom";
import { CreateDebtForm } from "@/features/create-debt";

export function CreateDebtPage() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const contactId = searchParams.get("contactId") ?? undefined;
	const backTo = contactId ? `/contacts/${contactId}` : "/";

	return (
		<div className="animate-in fade-in flex flex-1 flex-col duration-300">
			<CreateDebtForm
				initialContactId={contactId}
				onSuccess={() => navigate(backTo)}
				onCancel={() => navigate(backTo)}
			/>
		</div>
	);
}
