import { Check, ChevronRight, ReceiptText } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { SegmentedControl, SegmentedControlItem } from "@/components/ui/segmented-control";
import { formatMoney } from "@/shared/lib/format-amount";
import { formatShortDate } from "@/shared/lib/format-date";
import { formatPeopleCount } from "@/shared/lib/format-people-count";
import type { CurrencyCode } from "@/shared/lib/storage";
import { cn } from "@/shared/lib/utils";
import { groupBillTransfers } from "../model/bill/compute-bill";
import { type Bill, type BillTransfer, type BillTransferGrouping, ME_REF } from "../model/bill/types";
import { ENTITY_DEBT_NS } from "../translations";
import { AmountPill } from "./AmountPill";
import { ParticipantAvatar, useParticipantName } from "./BillParticipant";

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
function BillMyPart({ totals, currency, closed }: MyPartProps) {
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

/**
 * «6 000 ₽ на четверых»; у счёта по чеку — «4 880 ₽ по чеку»: с людьми без имени число участников ничего не говорит.
 */
function useBillAmountForPeople(bill: Pick<Bill, "totalAmount" | "currency" | "participants" | "splitMode">): string {
	const { t } = useTranslation(ENTITY_DEBT_NS);
	if (bill.splitMode === "items") {
		return t("billAmountByReceipt", { amount: formatMoney(bill.totalAmount, bill.currency) });
	}
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

type TransferListProps = {
	transfers: BillTransfer[];
	currency: CurrencyCode;
	/** Связанный с моим переводом долг погашен: сумма приглушена, без знака, подпись «✓ погашен». */
	isRepaid?: (transfer: BillTransfer) => boolean;
	/** Плотнее — для формы счёта. */
	compact?: boolean;
};

/**
 * «Кто кому переводит»: переключатель «Кто переводит / Кто получает» и группы по отправителю («кому:», «всего» —
 * если переводов больше одного) или по получателю («от:», «<имя> получит»). Мои переводы — со знаком и цветом
 * направления, чужие — нейтрально.
 */
export function TransferList({ transfers, currency, isRepaid, compact }: TransferListProps) {
	const { t } = useTranslation(ENTITY_DEBT_NS);
	const nameOf = useParticipantName();
	const [by, setBy] = useState<BillTransferGrouping>("from");
	const groups = groupBillTransfers(transfers, by);

	const groupTitle = (ref: string) => {
		if (by === "from") return ref === ME_REF ? t("transferGroupFromMe") : nameOf(ref);
		return ref === ME_REF ? t("transferGroupToMe") : t("transferGroupTo", { name: nameOf(ref) });
	};
	const counterpart = (tr: BillTransfer) => {
		const ref = by === "from" ? tr.to : tr.from;
		if (ref !== ME_REF) return nameOf(ref);
		return by === "from" ? t("transferWhoToMe") : t("transferWhoFromMe");
	};

	return (
		<div className="flex flex-col">
			<SegmentedControl
				aria-label={t("transferGroupingLabel")}
				value={by}
				onValueChange={(next) => setBy(next === "to" ? "to" : "from")}
				className="mb-1 rounded-2xl"
			>
				<SegmentedControlItem value="from" className={cn("rounded-xl", compact ? "min-h-9 text-[13px]" : "min-h-10")}>
					{t("transferGroupingFrom")}
				</SegmentedControlItem>
				<SegmentedControlItem value="to" className={cn("rounded-xl", compact ? "min-h-9 text-[13px]" : "min-h-10")}>
					{t("transferGroupingTo")}
				</SegmentedControlItem>
			</SegmentedControl>
			<ul>
				{groups.map((group, index) => {
					const showTotal = by === "to" || group.transfers.length > 1;
					return (
						<li key={group.ref} className={cn(compact ? "py-2" : "py-2.5", index > 0 && "border-t")}>
							<div className={cn("flex items-center gap-2.5", compact ? "min-h-7" : "min-h-8")}>
								<ParticipantAvatar
									participantRef={group.ref}
									className={compact ? "size-6 text-[11px]" : "size-7 text-xs"}
								/>
								<span
									className={cn(
										"min-w-0 flex-1 font-semibold break-words",
										compact ? "text-sm leading-5" : "text-[15px] leading-5",
									)}
								>
									{groupTitle(group.ref)}
								</span>
								{showTotal ? (
									<span
										className={cn(
											"shrink-0 whitespace-nowrap tabular-nums",
											by === "from"
												? "text-caption text-muted-foreground"
												: cn("font-semibold", compact ? "text-sm" : "text-[15px]"),
										)}
									>
										{by === "from"
											? t("transferGroupTotal", { amount: formatMoney(group.total, currency) })
											: formatMoney(group.total, currency)}
									</span>
								) : null}
							</div>
							<ul className={compact ? "pl-[34px]" : "pl-[38px]"}>
								{group.transfers.map((tr) => {
									const mine = tr.to === ME_REF ? "owed_to_me" : tr.from === ME_REF ? "i_owe" : null;
									const repaid = mine !== null && (isRepaid?.(tr) ?? false);
									return (
										<li
											key={`${tr.from}-${tr.to}`}
											className={cn("flex items-center gap-2 py-0.5", compact ? "min-h-8" : "min-h-9")}
										>
											<span className="flex min-w-0 flex-1 flex-col">
												<span className="text-muted-foreground text-sm leading-5 break-words">
													{t(by === "from" ? "transferToLabel" : "transferFromLabel")}{" "}
													<span className="text-foreground font-medium">{counterpart(tr)}</span>
												</span>
												{repaid ? (
													<span className="text-caption text-muted-foreground inline-flex items-center gap-1">
														<Check className="size-3" strokeWidth={2.8} aria-hidden="true" />
														{t("transferRepaid")}
													</span>
												) : null}
											</span>
											{mine && !repaid ? (
												<AmountPill amount={tr.amount} currency={currency} direction={mine} />
											) : (
												<span
													className={cn(
														"shrink-0 font-semibold whitespace-nowrap tabular-nums",
														compact ? "text-sm" : "text-[15px]",
														repaid && "text-muted-foreground",
													)}
												>
													{formatMoney(tr.amount, currency)}
												</span>
											)}
										</li>
									);
								})}
							</ul>
						</li>
					);
				})}
			</ul>
		</div>
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
