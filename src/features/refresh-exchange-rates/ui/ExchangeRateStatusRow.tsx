import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useDebtStore } from "@/entities/debt";
import { formatLongDate, formatMoment } from "@/shared/lib/format-date";
import { useOnlineStatus } from "@/shared/lib/use-online-status";
import { cn } from "@/shared/lib/utils";
import { REFRESH_RATES_NS } from "../translations";

/**
 * Строка «Курс валют»: когда загружен, нет сети (с датой сохранённого курса) или ошибка загрузки,
 * и кнопка принудительного обновления («Повторить» после ошибки).
 */
export function ExchangeRateStatusRow({ className }: { className?: string }) {
	const { t } = useTranslation(REFRESH_RATES_NS);
	const ratesCache = useDebtStore((s) => s.ratesCache);
	const ratesFetchError = useDebtStore((s) => s.ratesFetchError);
	const refreshRatesIfStale = useDebtStore((s) => s.refreshRatesIfStale);
	const online = useOnlineStatus();
	const [pending, setPending] = useState(false);

	const failed = online && Boolean(ratesFetchError);
	let status: string;
	if (!online) {
		status = ratesCache ? t("statusOffline", { date: formatLongDate(ratesCache.date) }) : t("statusMissing");
	} else if (failed) {
		status = t("statusFailed");
	} else if (ratesCache) {
		status = t("statusUpdated", { moment: formatMoment(ratesCache.fetchedAt) });
	} else {
		status = t("statusMissing");
	}

	const handleRefresh = async () => {
		setPending(true);
		try {
			await refreshRatesIfStale(true);
		} finally {
			setPending(false);
		}
	};

	return (
		<div className={cn("flex items-center gap-3", className)}>
			<span className="flex min-w-0 flex-1 flex-col">
				<span className="text-body lg:text-[15px]">{t("label")}</span>
				<span
					aria-live="polite"
					className={cn("text-caption", failed ? "text-destructive font-medium" : "text-muted-foreground")}
				>
					{status}
				</span>
			</span>
			<Button
				type="button"
				variant="secondary"
				onClick={() => void handleRefresh()}
				disabled={pending}
				className="h-10 px-3.5 font-medium lg:rounded-[12px]"
			>
				<RefreshCw className={cn(pending && "animate-spin")} aria-hidden="true" />
				{t(failed ? "retry" : "refresh")}
			</Button>
		</div>
	);
}
