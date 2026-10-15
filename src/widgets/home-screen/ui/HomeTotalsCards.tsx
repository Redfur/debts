import { useTranslation } from "react-i18next";
import { DirectionIcon, ENTITY_DEBT_NS } from "@/entities/debt";
import { nextSupportedCurrency } from "@/shared/config/currencies";
import { setDisplayCurrency } from "@/shared/lib/currency-preference";
import { formatMoney } from "@/shared/lib/format-amount";
import type { CurrencyCode, DebtDirection } from "@/shared/lib/storage";
import { cn } from "@/shared/lib/utils";
import { CurrencyBreakdown } from "@/shared/ui/money";
import { HOME_SCREEN_NS } from "../translations";

type CardProps = {
	direction: DebtDirection;
	converted: number | null;
	byCurrency: Partial<Record<CurrencyCode, number>>;
	displayCurrency: CurrencyCode;
};

/** Карточка итога направления. Нажатие на сумму переключает настройку «Валюта итогов» по кругу. */
export function TotalCard({ direction, converted, byCurrency, displayCurrency }: CardProps) {
	const { t } = useTranslation(HOME_SCREEN_NS);
	const { t: tDebt } = useTranslation(ENTITY_DEBT_NS);
	const owedToMe = direction === "owed_to_me";
	const label = tDebt(owedToMe ? "directionOwedToMe" : "directionIOwe");
	const isZero = converted === 0 || (converted === null && Object.keys(byCurrency).length === 0);

	if (isZero) {
		return (
			<section
				aria-label={label}
				className="bg-card shadow-card flex flex-col gap-1 rounded-card px-[18px] py-4 lg:px-6 lg:py-[22px]"
			>
				<div className="text-muted-foreground flex items-center gap-2 text-sm font-semibold lg:text-[15px]">
					<DirectionIcon direction={direction} className="bg-muted text-muted-foreground" />
					{label}
				</div>
				<span className="text-amount-l text-muted-foreground font-semibold">{formatMoney(0, displayCurrency)}</span>
				<span className="text-caption text-muted-foreground">{tDebt(owedToMe ? "zeroOwedToMe" : "zeroIOwe")}</span>
			</section>
		);
	}

	return (
		<section
			aria-label={label}
			className={cn(
				"flex flex-col gap-1.5 rounded-card px-[18px] py-4 lg:gap-2 lg:px-6 lg:py-[22px]",
				owedToMe ? "bg-owed-to-me-muted" : "bg-i-owe-muted",
			)}
		>
			<div
				className={cn(
					"flex items-center gap-2 text-sm font-semibold lg:text-[15px]",
					owedToMe ? "text-owed-to-me-strong" : "text-i-owe-strong",
				)}
			>
				<DirectionIcon direction={direction} />
				{label}
			</div>
			{converted === null ? (
				<>
					<span className="text-amount-xl text-muted-foreground">
						<span aria-hidden="true">—</span>
						<span className="sr-only">{t("noRateA11y")}</span>
					</span>
					<CurrencyBreakdown
						byCurrency={byCurrency}
						className={cn("text-sm font-medium", owedToMe ? "text-owed-to-me-strong" : "text-i-owe-strong")}
					/>
				</>
			) : (
				<button
					type="button"
					onClick={() => setDisplayCurrency(nextSupportedCurrency(displayCurrency))}
					aria-label={t("amountA11y", { label, amount: formatMoney(converted, displayCurrency) })}
					className="text-amount-xl lg:text-amount-display flex min-h-11 items-center self-start rounded-md text-left whitespace-nowrap text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					{formatMoney(converted, displayCurrency)}
				</button>
			)}
		</section>
	);
}
