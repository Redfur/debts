import { Trans, useTranslation } from "react-i18next";
import { formatMoney } from "@/shared/lib/format-amount";
import type { CurrencyCode } from "@/shared/lib/storage";
import { cn } from "@/shared/lib/utils";
import type { NetPosition } from "../model/types";
import { ENTITY_DEBT_NS } from "../translations";

type RatioBarProps = {
	owedToMe: number;
	owedByMe: number;
	className?: string;
};

/** Полоса соотношения «мне должны / я должен» (декоративная, смысл передаёт строка чистой позиции). */
export function RatioBar({ owedToMe, owedByMe, className }: RatioBarProps) {
	return (
		<div aria-hidden="true" className={cn("flex h-2 gap-[3px]", className)}>
			{owedToMe > 0 ? <span className="rounded-full bg-owed-to-me" style={{ flex: `${owedToMe} 1 0` }} /> : null}
			{owedByMe > 0 ? <span className="rounded-full bg-i-owe" style={{ flex: `${owedByMe} 1 0` }} /> : null}
		</div>
	);
}

type NetPositionLineProps = {
	net: NetPosition;
	currency: CurrencyCode;
	className?: string;
};

/** «Вам должны на X больше» / «Вы должны на X больше» / «Долги уравновешены». */
export function NetPositionLine({ net, currency, className }: NetPositionLineProps) {
	const { t } = useTranslation(ENTITY_DEBT_NS);
	if (net.kind === "none") return null;
	return (
		<p className={cn("text-caption text-muted-foreground", className)}>
			{net.kind === "balanced" ? (
				t("netBalanced")
			) : (
				<Trans
					t={t}
					i18nKey={net.kind === "owed-to-me" ? "netOwedToMe" : "netIOwe"}
					values={{ amount: formatMoney(net.diff, currency) }}
					components={{ b: <b className="text-foreground font-semibold" /> }}
				/>
			)}
		</p>
	);
}
