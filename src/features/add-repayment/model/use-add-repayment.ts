import { useRef, useState } from "react";
import { useDebtStore } from "@/entities/debt";

export function useAddRepayment() {
	const addRepayment = useDebtStore((s) => s.addRepayment);
	const [pending, setPending] = useState(false);
	const running = useRef(false);

	const submit = async (debtId: string, amount: number, note?: string) => {
		if (running.current) return false;
		running.current = true;
		setPending(true);
		try {
			return await addRepayment(debtId, amount, note);
		} finally {
			running.current = false;
			setPending(false);
		}
	};

	return { submit, pending };
}
