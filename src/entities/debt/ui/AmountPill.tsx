import { useTranslation } from "react-i18next";
import { formatMoney } from "@/shared/lib/format-amount";
import type { CurrencyCode, DebtDirection } from "@/shared/lib/storage";
import { cn } from "@/shared/lib/utils";
import { ENTITY_DEBT_NS } from "../translations";

type Props = {
	amount: number;
	currency: CurrencyCode;
	direction: DebtDirection;
	/** `pill` — плашка с фоном; `text` — только цветной текст (строки выбора контакта). */
	variant?: "pill" | "text";
	className?: string;
};

/** Плашка суммы с направлением: «+10 000 ₽» / «−2 300 ₽» в цветах роли; диктор читает «Мне должны 10 000 ₽». */
export function AmountPill({ amount, currency, direction, variant = "pill", className }: Props) {
	const { t } = useTranslation(ENTITY_DEBT_NS);
	const money = formatMoney(amount, currency);
	const owedToMe = direction === "owed_to_me";
	return (
		<span
			role="img"
			aria-label={t(owedToMe ? "amountOwedToMeA11y" : "amountIOweA11y", { amount: money })}
			className={cn(
				"inline-block whitespace-nowrap tabular-nums",
				variant === "pill" && "rounded-chip px-2 py-0.5 text-sm leading-[18px] font-semibold",
				variant === "pill" && (owedToMe ? "bg-owed-to-me-muted" : "bg-i-owe-muted"),
				owedToMe ? "text-owed-to-me-strong" : "text-i-owe-strong",
				className,
			)}
		>
			{owedToMe ? "+" : "−"}
			{money}
		</span>
	);
}
