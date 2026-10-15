import { ArrowRight, Check, ChevronRight, ReceiptText } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/shared/lib/format-amount";
import { formatShortDate } from "@/shared/lib/format-date";
import { formatPeopleCount } from "@/shared/lib/format-people-count";
import type { CurrencyCode } from "@/shared/lib/storage";
import { cn } from "@/shared/lib/utils";
import type { Bill } from "../model/bill/types";
import { ENTITY_DEBT_NS } from "../translations";
import { AmountPill } from "./AmountPill";

/** Откуда открыт экран счёта — определяет «назад». */
export type BillLinkState = { from: "home" } | { from: "contact"; contactId: string };

/** Бейдж «Активный» / «✓ Закрыт». */
export function BillStatusBadge({ closed, className }: { closed: boolean; className?: string }) {
	const { t } = useTranslation(ENTITY_DEBT_NS);
	return closed ? (
		<Badge variant="neutral" className={className}>
			<Check strokeWidth={2.6} />
			{t("billClosed")}
		</Badge>
	) : (
		<Badge variant="accent" className={cn("font-semibold", className)}>
			{t("billActive")}
		</Badge>
	);
}

type MyPartProps = {
	totals: { owedToMe: number; iOwe: number };
	currency: CurrencyCode;
	closed: boolean;
};

/** Плашка строки счёта: «+X» мне переводят, «−X» перевожу я, «без меня», у закрытых — «✓ Закрыт». */
export function BillMyPart({ totals, currency, closed }: MyPartProps) {
	const { t } = useTranslation(ENTITY_DEBT_NS);
	if (closed) {
		return (
			<span className="text-caption text-muted-foreground inline-flex shrink-0 items-center gap-1 font-medium">
				<Check className="size-3.5" strokeWidth={2.6} aria-hidden="true" />
				{t("billClosed")}
			</span>
		);
	}
	if (totals.owedToMe > 0) return <AmountPill amount={totals.owedToMe} currency={currency} direction="owed_to_me" />;
	if (totals.iOwe > 0) return <AmountPill amount={totals.iOwe} currency={currency} direction="i_owe" />;
	return (
		<span className="bg-secondary text-muted-foreground rounded-chip inline-block shrink-0 px-2 py-0.5 text-sm leading-[18px] font-medium whitespace-nowrap">
			{t("billWithoutMe")}
		</span>
	);
}

/** «6 000 ₽ на четверых». */
export function useBillAmountForPeople(bill: Pick<Bill, "totalAmount" | "currency" | "participants">): string {
	const { t } = useTranslation(ENTITY_DEBT_NS);
	return t("billAmountForPeople", {
		amount: formatMoney(bill.totalAmount, bill.currency),
		people: formatPeopleCount(bill.participants.length),
	});
}

type RowProps = MyPartProps & { bill: Bill };

/** Строка счёта на главной: иконка, описание, «<дата> · <сумма> на <N>» и плашка. */
export function BillRow({ bill, totals, currency, closed }: RowProps) {
	const { t } = useTranslation(ENTITY_DEBT_NS);
	const amountForPeople = useBillAmountForPeople(bill);
	const state: BillLinkState = { from: "home" };
	return (
		<Link
			to={`/bills/${bill.id}`}
			state={state}
			className="text-foreground hover:bg-secondary focus-visible:bg-secondary active:bg-secondary flex min-h-16 items-center gap-3 px-4 py-2.5 transition-colors outline-none"
		>
			<span
				aria-hidden="true"
				className="bg-secondary text-muted-foreground flex size-[42px] shrink-0 items-center justify-center rounded-[14px]"
			>
				<ReceiptText className="size-5" />
			</span>
			<span className="flex min-w-0 flex-1 flex-col">
				<span className="text-body truncate font-medium">{bill.title ?? t("billUntitled")}</span>
				<span className="text-caption text-muted-foreground truncate">
					{formatShortDate(bill.createdAt)} · {amountForPeople}
				</span>
			</span>
			<BillMyPart totals={totals} currency={currency} closed={closed} />
		</Link>
	);
}

type TransferRowProps = {
	from: string;
	to: string;
	amount: number;
	currency: CurrencyCode;
	/** Перевод с «Я»: `in` — мне, `out` — от меня; `null` — между другими участниками. */
	mine: "in" | "out" | null;
	/** Подпись под строкой («✓ погашен», «переведёт вам»). */
	caption?: ReactNode;
	/** Связанный долг погашен: сумма приглушена, без знака. */
	repaid?: boolean;
	className?: string;
};

/** Строка «<кто> → <кому>» и сумма: мои переводы — со знаком и цветом направления, чужие — нейтрально. */
export function TransferRow({ from, to, amount, currency, mine, caption, repaid, className }: TransferRowProps) {
	const { t } = useTranslation(ENTITY_DEBT_NS);
	return (
		<li className={cn("flex min-h-13 items-center gap-3 py-2", className)}>
			<span className="flex min-w-0 flex-1 flex-col gap-0.5">
				<span className="text-body flex flex-wrap items-center gap-x-1.5 font-medium">
					<span className="break-words">{from}</span>
					<ArrowRight
						className="text-muted-foreground size-4 shrink-0"
						strokeWidth={2.2}
						aria-label={t("transferTo")}
					/>
					<span className="break-words">{to}</span>
				</span>
				{caption ? <span className="text-caption text-muted-foreground">{caption}</span> : null}
			</span>
			{mine && !repaid ? (
				<AmountPill amount={amount} currency={currency} direction={mine === "in" ? "owed_to_me" : "i_owe"} />
			) : (
				<span
					className={cn(
						"text-body shrink-0 font-semibold whitespace-nowrap tabular-nums",
						repaid && "text-muted-foreground",
					)}
				>
					{formatMoney(amount, currency)}
				</span>
			)}
		</li>
	);
}

/** Метка «Из счёта · 6 000 ₽ на четверых» со ссылкой на экран счёта (карточка долга). */
export function BillLink({ bill, state, className }: { bill: Bill; state: BillLinkState; className?: string }) {
	const { t } = useTranslation(ENTITY_DEBT_NS);
	const amountForPeople = useBillAmountForPeople(bill);
	return (
		<Link
			to={`/bills/${bill.id}`}
			state={state}
			className={cn(
				"bg-accent-muted text-accent-strong flex min-h-11 items-center gap-2 rounded-[14px] px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
				className,
			)}
		>
			<ReceiptText className="size-[18px] shrink-0" aria-hidden="true" />
			<span className="min-w-0 flex-1">{t("billLink", { amountForPeople })}</span>
			<ChevronRight className="size-4 shrink-0" strokeWidth={2.2} aria-hidden="true" />
		</Link>
	);
}
