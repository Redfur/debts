import { useEffect } from "react";
import { hydrateCreationDraft, useDebtStore } from "@/entities/debt";

export function AppHydrationProvider({ children }: { children: React.ReactNode }) {
	const hydrate = useDebtStore((s) => s.hydrate);

	useEffect(() => {
		void hydrate().then(() => Promise.all([hydrateCreationDraft("debt"), hydrateCreationDraft("bill")]));
	}, [hydrate]);

	return children;
}
