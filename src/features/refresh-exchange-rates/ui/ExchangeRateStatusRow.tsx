import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useDebtStore } from "@/entities/debt";
import { REFRESH_RATES_NS } from "../translations";

export function ExchangeRateStatusRow() {
	const { t } = useTranslation(REFRESH_RATES_NS);
	const ratesCache = useDebtStore((s) => s.ratesCache);
	const ratesFetchError = useDebtStore((s) => s.ratesFetchError);
	const refreshRatesIfStale = useDebtStore((s) => s.refreshRatesIfStale);
	const [pending, setPending] = useState(false);

	const handleRefresh = async () => {
		setPending(true);
		try {
			await refreshRatesIfStale(true);
		} finally {
			setPending(false);
		}
	};

	return (
		<div className="flex items-center justify-between gap-2">
			<div className="min-w-0 flex-1">
				<p className="text-sm">{ratesCache ? t("statusUpdated", { date: ratesCache.date }) : t("statusMissing")}</p>
				{ratesFetchError ? <p className="text-destructive mt-0.5 text-xs">{t("statusError")}</p> : null}
			</div>
			<Button type="button" variant="outline" size="sm" onClick={() => void handleRefresh()} disabled={pending}>
				<RefreshCw />
				{t("refreshAction")}
			</Button>
		</div>
	);
}
