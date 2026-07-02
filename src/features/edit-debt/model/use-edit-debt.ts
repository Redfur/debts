import { useState } from "react";
import { useDebtStore } from "@/entities/debt";
import type { CurrencyCode, DebtDirection } from "@/shared/lib/storage";

type SubmitInput = {
	direction?: DebtDirection;
	currency?: CurrencyCode;
	amount?: number;
	note?: string;
};

export function useEditDebt() {
	const updateDebt = useDebtStore((s) => s.updateDebt);
	const [pending, setPending] = useState(false);

	const submit = async (debtId: string, input: SubmitInput) => {
		if (pending) return false;
		setPending(true);
		try {
			return await updateDebt(debtId, input);
		} finally {
			setPending(false);
		}
	};

	return { submit, pending };
}
