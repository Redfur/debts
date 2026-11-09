import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { localeCurrency, prioritizedCurrencies } from "@/shared/config/currencies";
import { useCurrencyPreferences } from "@/shared/lib/currency-preference";
import { debtCurrencies } from "./debt-currencies";
import { useDebtStore } from "./debt-store";

export function useDebtCurrencies() {
	const debts = useDebtStore((s) => s.debtsById);
	const operations = useDebtStore((s) => s.operationsByDebtId);
	const { preferred } = useCurrencyPreferences();
	const { i18n } = useTranslation();
	const locale = localeCurrency(i18n.resolvedLanguage ?? i18n.language);
	return useMemo(() => {
		const { all, active } = debtCurrencies(debts, operations);
		return {
			top: prioritizedCurrencies(all, preferred, locale),
			cycle: prioritizedCurrencies(active, preferred, locale),
		};
	}, [debts, operations, preferred, locale]);
}
