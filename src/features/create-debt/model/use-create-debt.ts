import { useState } from "react";
import { useDebtStore } from "@/entities/debt";
import type { CurrencyCode, DebtDirection } from "@/shared/lib/storage";

type SubmitInput = {
	contactId: string;
	direction: DebtDirection;
	currency: CurrencyCode;
	amount: number;
	note?: string;
};

export function useCreateDebt() {
	const createDebt = useDebtStore((s) => s.createDebt);
	const [pending, setPending] = useState(false);

	const submit = async (input: SubmitInput) => {
		if (pending) return undefined;
		setPending(true);
		try {
			return await createDebt(input);
		} finally {
			setPending(false);
		}
	};

	return { submit, pending };
}
