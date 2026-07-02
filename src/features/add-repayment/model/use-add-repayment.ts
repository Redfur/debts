import { useState } from "react";
import { useDebtStore } from "@/entities/debt";

export function useAddRepayment() {
	const addRepayment = useDebtStore((s) => s.addRepayment);
	const [pending, setPending] = useState(false);

	const submit = async (debtId: string, amount: number, note?: string) => {
		if (pending) return false;
		setPending(true);
		try {
			return await addRepayment(debtId, amount, note);
		} finally {
			setPending(false);
		}
	};

	return { submit, pending };
}
