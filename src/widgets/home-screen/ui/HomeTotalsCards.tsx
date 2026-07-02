import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { computeGlobalTotals, useDebtStore } from "@/entities/debt";
import { CURRENCY_SYMBOL, type SUPPORTED_CURRENCIES } from "@/shared/config/currencies";
import { useDisplayCurrency } from "@/shared/lib/currency-preference";
import { formatAmount } from "@/shared/lib/format-amount";
import { HOME_SCREEN_NS } from "../translations";

type CurrencyBreakdown = Partial<Record<(typeof SUPPORTED_CURRENCIES)[number], number>>;

function formatBreakdown(byCurrency: CurrencyBreakdown): string | null {
	const entries = Object.entries(byCurrency) as [(typeof SUPPORTED_CURRENCIES)[number], number][];
	if (entries.length === 0) return null;
	return entries.map(([code, amount]) => `${formatAmount(amount)} ${CURRENCY_SYMBOL[code]}`).join(" + ");
}

export function HomeTotalsCards() {
	const { t } = useTranslation(HOME_SCREEN_NS);
	const debtsById = useDebtStore((s) => s.debtsById);
	const operationsByDebtId = useDebtStore((s) => s.operationsByDebtId);
	const ratesCache = useDebtStore((s) => s.ratesCache);
	const displayCurrency = useDisplayCurrency();

	const totals = computeGlobalTotals(debtsById, operationsByDebtId, ratesCache, displayCurrency);
	const owedToMeBreakdown = formatBreakdown(totals.owedToMeByCurrency);
	const owedByMeBreakdown = formatBreakdown(totals.owedByMeByCurrency);

	return (
		<div className="grid gap-3 sm:grid-cols-2">
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-sm font-medium">{t("owedToMeTitle")}</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-2xl font-semibold">
						{totals.totalOwedToMeConverted !== null
							? `${formatAmount(totals.totalOwedToMeConverted)} ${CURRENCY_SYMBOL[displayCurrency]}`
							: "—"}
					</p>
					{owedToMeBreakdown ? <p className="text-muted-foreground mt-1 text-xs">{owedToMeBreakdown}</p> : null}
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-sm font-medium">{t("owedByMeTitle")}</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-2xl font-semibold">
						{totals.totalOwedByMeConverted !== null
							? `${formatAmount(totals.totalOwedByMeConverted)} ${CURRENCY_SYMBOL[displayCurrency]}`
							: "—"}
					</p>
					{owedByMeBreakdown ? <p className="text-muted-foreground mt-1 text-xs">{owedByMeBreakdown}</p> : null}
				</CardContent>
			</Card>
		</div>
	);
}
