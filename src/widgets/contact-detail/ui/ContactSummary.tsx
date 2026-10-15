import { useTranslation } from "react-i18next";
import {
	type ContactTotals,
	computeNetPosition,
	DirectionIcon,
	ENTITY_DEBT_NS,
	NetPositionLine,
	RatioBar,
} from "@/entities/debt";
import { formatMoney } from "@/shared/lib/format-amount";
import type { CurrencyCode, DebtDirection } from "@/shared/lib/storage";
import { cn } from "@/shared/lib/utils";
import { CurrencyBreakdown } from "@/shared/ui/money";
import { CONTACT_DETAIL_NS } from "../translations";

type Props = {
	totals: ContactTotals;
	displayCurrency: CurrencyCode;
};

/** Сводка контакта в валюте итогов + чистая позиция; на десктопе третья карточка «Разница». */
export function ContactSummary({ totals, displayCurrency }: Props) {
	const { t } = useTranslation(CONTACT_DETAIL_NS);
	const net = computeNetPosition(totals.owedToMe.converted, totals.owedByMe.converted);
	const owedToMe = totals.owedToMe.converted ?? 0;
	const owedByMe = totals.owedByMe.converted ?? 0;

	return (
		<>
			<div className="mt-1 grid grid-cols-2 gap-2 lg:grid-cols-3 lg:gap-4">
				<SummaryCard direction="owed_to_me" total={totals.owedToMe} displayCurrency={displayCurrency} />
				<SummaryCard direction="i_owe" total={totals.owedByMe} displayCurrency={displayCurrency} />
				{net.kind !== "none" ? (
					<section
						aria-label={t("difference")}
						className="bg-card shadow-card hidden flex-col justify-between gap-2.5 rounded-card px-5 py-[18px] lg:flex"
					>
						<NetPositionLine
							net={net}
							currency={displayCurrency}
							className="text-foreground text-[15px] leading-[22px]"
						/>
						<RatioBar owedToMe={owedToMe} owedByMe={owedByMe} />
					</section>
				) : null}
			</div>
			{net.kind !== "none" ? (
				<div className="flex flex-col gap-2 px-1 pt-0.5 pb-1.5 lg:hidden">
					<RatioBar owedToMe={owedToMe} owedByMe={owedByMe} />
					<NetPositionLine net={net} currency={displayCurrency} />
				</div>
			) : null}
		</>
	);
}

function SummaryCard({
	direction,
	total,
	displayCurrency,
}: {
	direction: DebtDirection;
	total: ContactTotals["owedToMe"];
	displayCurrency: CurrencyCode;
}) {
	const { t } = useTranslation(CONTACT_DETAIL_NS);
	const { t: tDebt } = useTranslation(ENTITY_DEBT_NS);
	const owedToMe = direction === "owed_to_me";
	const label = tDebt(owedToMe ? "directionOwedToMe" : "directionIOwe");
	const currencies = Object.keys(total.byCurrency);
	const isEmpty = currencies.length === 0;
	// Исходная валюта под суммой — если она не одна или отличается от валюты итогов.
	const showBreakdown = !isEmpty && !(currencies.length === 1 && currencies[0] === displayCurrency);

	return (
		<section
			aria-label={label}
			className={cn(
				"flex min-w-0 flex-col gap-1 rounded-[20px] px-4 py-3.5 lg:rounded-card lg:px-5 lg:py-[18px]",
				isEmpty ? "bg-card shadow-card" : owedToMe ? "bg-owed-to-me-muted" : "bg-i-owe-muted",
			)}
		>
			<span
				className={cn(
					"flex items-center gap-1.5 text-[13px] leading-[18px] font-semibold lg:text-sm",
					isEmpty ? "text-muted-foreground" : owedToMe ? "text-owed-to-me-strong" : "text-i-owe-strong",
				)}
			>
				<DirectionIcon
					direction={direction}
					className={cn("size-[18px] [&_svg]:size-3", isEmpty && "bg-muted text-muted-foreground")}
				/>
				{label}
			</span>
			{total.converted === null ? (
				<span className="text-amount-l text-muted-foreground lg:text-[28px] lg:leading-[34px]">
					<span aria-hidden="true">—</span>
					<span className="sr-only">{t("noRateA11y")}</span>
				</span>
			) : (
				<span
					className={cn(
						"text-amount-l truncate lg:text-[28px] lg:leading-[34px]",
						isEmpty && "text-muted-foreground font-semibold",
					)}
				>
					{formatMoney(total.converted, displayCurrency)}
				</span>
			)}
			{showBreakdown ? (
				<CurrencyBreakdown
					byCurrency={total.byCurrency}
					className={cn("text-caption font-medium", owedToMe ? "text-owed-to-me-strong" : "text-i-owe-strong")}
				/>
			) : null}
		</section>
	);
}
