import { formatMoney, formatMoneyBreakdown } from "@/shared/lib/format-amount";
import type { CurrencyCode } from "@/shared/lib/storage";
import { cn } from "@/shared/lib/utils";

type MoneyProps = {
	amount: number;
	currency: CurrencyCode;
	className?: string;
};

/** Сумма с символом валюты: табличные цифры, без переноса между числом и символом. */
export function Money({ amount, currency, className }: MoneyProps) {
	return <span className={cn("whitespace-nowrap tabular-nums", className)}>{formatMoney(amount, currency)}</span>;
}

type CurrencyBreakdownProps = {
	byCurrency: Partial<Record<CurrencyCode, number>>;
	/** Что показать, если сумм нет (по умолчанию ничего). */
	fallback?: string;
	className?: string;
};

/** «10 000 ₽ + 250 $» — разбивка по исходным валютам. */
export function CurrencyBreakdown({ byCurrency, fallback, className }: CurrencyBreakdownProps) {
	const text = formatMoneyBreakdown(byCurrency) ?? fallback;
	if (!text) return null;
	return <span className={cn("tabular-nums", className)}>{text}</span>;
}
