import { useEffect } from "react";
import { useDebtStore } from "@/entities/debt";

export function AppHydrationProvider({ children }: { children: React.ReactNode }) {
	const hydrate = useDebtStore((s) => s.hydrate);

	useEffect(() => {
		void hydrate();
	}, [hydrate]);

	return children;
}
