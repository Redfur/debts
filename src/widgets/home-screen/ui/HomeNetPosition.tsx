import { TriangleAlert } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { computeNetPosition, NetPositionLine, RatioBar, useDebtStore } from "@/entities/debt";
import type { CurrencyCode } from "@/shared/lib/storage";
import { HOME_SCREEN_NS } from "../translations";

type Props = {
	owedToMe: number | null;
	owedByMe: number | null;
	displayCurrency: CurrencyCode;
};

/** Полоса соотношения и строка чистой позиции; без курса — предупреждение с «Повторить». */
export function HomeNetPosition({ owedToMe, owedByMe, displayCurrency }: Props) {
	const net = computeNetPosition(owedToMe, owedByMe);
	if (owedToMe === null || owedByMe === null) return <NoRateNotice />;
	if (net.kind === "none") return null;
	return (
		<div className="flex flex-col gap-2 px-1 pt-1.5 pb-2 lg:hidden">
			<RatioBar owedToMe={owedToMe} owedByMe={owedByMe} />
			<NetPositionLine net={net} currency={displayCurrency} />
		</div>
	);
}

/** Карточка «Разница» на десктопе. */
export function HomeDifferenceCard({ owedToMe, owedByMe, displayCurrency }: Props) {
	const { t } = useTranslation(HOME_SCREEN_NS);
	const net = computeNetPosition(owedToMe, owedByMe);
	if (owedToMe === null || owedByMe === null || net.kind === "none") return null;
	return (
		<section
			aria-label={t("difference")}
			className="bg-card shadow-card hidden flex-col justify-between gap-3.5 rounded-card px-6 py-[22px] lg:flex"
		>
			<span className="text-muted-foreground text-[15px] leading-5 font-semibold">{t("difference")}</span>
			<NetPositionLine net={net} currency={displayCurrency} className="text-foreground text-[17px] leading-6" />
			<RatioBar owedToMe={owedToMe} owedByMe={owedByMe} />
		</section>
	);
}

function NoRateNotice() {
	const { t } = useTranslation(HOME_SCREEN_NS);
	const refreshRatesIfStale = useDebtStore((s) => s.refreshRatesIfStale);
	const [pending, setPending] = useState(false);

	return (
		<div
			role="status"
			className="bg-warning-muted text-warning mt-1 flex items-center gap-2.5 rounded-[16px] py-2 pr-2 pl-3.5 lg:col-span-full"
		>
			<TriangleAlert className="size-[18px] shrink-0" aria-hidden="true" />
			<span className="text-caption flex-1 font-medium">{t("noRateNotice")}</span>
			<Button
				type="button"
				size="sm"
				variant="secondary"
				disabled={pending}
				className="bg-card text-warning hover:bg-card/80"
				onClick={async () => {
					setPending(true);
					try {
						await refreshRatesIfStale(true);
					} finally {
						setPending(false);
					}
				}}
			>
				{t("retry")}
			</Button>
		</div>
	);
}
