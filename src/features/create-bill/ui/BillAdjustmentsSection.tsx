import { CircleAlert, Coins, Percent, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import { AmountInput } from "@/components/ui/amount-input";
import { SegmentedControl, SegmentedControlItem } from "@/components/ui/segmented-control";
import { type BillAdjustmentUnit, ME_REF, useParticipantName } from "@/entities/debt";
import { CURRENCY_SYMBOL } from "@/shared/config/currencies";
import { formatAmount, formatMoney } from "@/shared/lib/format-amount";
import { cn } from "@/shared/lib/utils";
import type { BillFormApi, FormAdjustment } from "../model/use-bill-form";
import { CREATE_BILL_NS } from "../translations";
import { BillPeopleChips } from "./BillPeopleChips";

type Props = {
	form: BillFormApi;
	/** После погашений: блоки неактивны, незаданные скидка и чаевые не показываются. */
	locked: boolean;
};

const DISCOUNT_ISSUE_KEYS = {
	zero: "discountZero",
	percent_max: "discountPercentMax",
	over_items: "discountOverItems",
} as const;

const TIPS_ISSUE_KEYS = { zero: "tipsZero", percent_max: "tipsPercentMax" } as const;

/** «Скидка на весь чек» и «Чаевые» под позициями; на десктопе — с подзаголовком «3 · Скидка и чаевые». */
export function BillAdjustmentsSection({ form, locked }: Props) {
	const { t } = useTranslation(CREATE_BILL_NS);
	const nameOf = useParticipantName();
	const { state, receipt } = form;
	const money = (cents: number) => formatMoney(Math.round(cents) / 100, state.currency);
	const percentOf = (cents: number, baseCents: number) =>
		t("percent", { value: formatAmount(Math.round((cents / baseCents) * 10000) / 100) });
	const keptCents = receipt.itemsCents - receipt.discountCents;
	const showDiscount = state.discount.open || !locked;
	const showTips = state.tips.open || !locked;
	if (!showDiscount && !showTips) return null;

	const discountIssue = receipt.discountIssue;
	const discountNote = discountIssue
		? t(DISCOUNT_ISSUE_KEYS[discountIssue])
		: state.discount.unit === "amount" && receipt.discountCents > 0
			? t("discountApprox", { percent: percentOf(receipt.discountCents, receipt.itemsCents) })
			: t("discountBase", { amount: money(receipt.itemsCents) });

	const tipsIssue = receipt.tipsIssue;
	const tipsValueIssue = tipsIssue === "zero" || tipsIssue === "percent_max" ? tipsIssue : null;
	const tipsBase = receipt.discountCents > 0 ? "Kept" : "Items";
	const tipsBaseCents = receipt.discountCents > 0 ? keptCents : receipt.itemsCents;
	const tipsNote = tipsValueIssue
		? t(TIPS_ISSUE_KEYS[tipsValueIssue])
		: state.tips.unit === "amount" &&
				receipt.tipsInputCents > 0 &&
				tipsBaseCents > 0 &&
				receipt.tipsInputCents <= tipsBaseCents
			? t(`tipsApprox${tipsBase}`, { percent: percentOf(receipt.tipsInputCents, tipsBaseCents) })
			: t(`tipsBase${tipsBase}`, { amount: money(tipsBaseCents) });
	const tipsPeople = state.tips.refs.length + state.tips.extraPeople;
	const tipsCaption =
		tipsIssue === "people"
			? t("tipsNeedPeople")
			: receipt.tipsCents > 0
				? t("itemPerPerson", { amount: money(receipt.tipsCents / tipsPeople), count: tipsPeople })
				: t("tipsPeople", { count: tipsPeople });

	return (
		<div className="flex flex-col gap-2.5 lg:border-t lg:pt-1.5">
			<h3 className="text-caption text-muted-foreground mt-2 hidden font-semibold lg:block">
				{t("adjustmentsHeading")}
			</h3>
			{showDiscount ? (
				<AdjustmentCard
					kind="discount"
					adjustment={state.discount}
					locked={locked}
					currency={CURRENCY_SYMBOL[state.currency]}
					result={receipt.discountInputCents > 0 ? `−${money(receipt.discountInputCents)}` : null}
					error={discountIssue !== null}
					note={discountNote}
					onOpen={form.openDiscount}
					onRemove={form.removeDiscount}
					onUnit={form.setDiscountUnit}
					onValue={form.setDiscountValue}
				/>
			) : null}
			{showTips ? (
				<AdjustmentCard
					kind="tips"
					adjustment={state.tips}
					locked={locked}
					currency={CURRENCY_SYMBOL[state.currency]}
					result={receipt.tipsInputCents > 0 ? `+${money(receipt.tipsInputCents)}` : null}
					error={tipsValueIssue !== null}
					note={tipsNote}
					onOpen={form.openTips}
					onRemove={form.removeTips}
					onUnit={form.setTipsUnit}
					onValue={form.setTipsValue}
				>
					<BillPeopleChips
						participantRefs={state.participants.map((p) => p.ref)}
						refs={state.tips.refs}
						extraPeople={state.tips.extraPeople}
						groupLabel={t("tipsGroup")}
						chipLabel={(ref, on) =>
							ref === ME_REF
								? t(on ? "tipsSplitsMe" : "tipsNotSplitsMe")
								: t(on ? "tipsSplits" : "tipsNotSplits", { name: nameOf(ref) })
						}
						onToggle={form.toggleTipsRef}
						onExtraPeople={form.setTipsExtraPeople}
						locked={locked}
					/>
					<Note error={tipsIssue === "people"}>{tipsCaption}</Note>
				</AdjustmentCard>
			) : null}
		</div>
	);
}

type CardProps = {
	kind: "discount" | "tips";
	adjustment: FormAdjustment;
	locked: boolean;
	currency: string;
	/** «−488 ₽» / «+439,2 ₽»; без значения — «—». */
	result: string | null;
	/** Значение с ошибкой: поле обведено, результат перечёркнут, под полем — причина. */
	error: boolean;
	note: string;
	onOpen: () => void;
	onRemove: () => void;
	onUnit: (unit: BillAdjustmentUnit) => void;
	onValue: (value: string) => void;
	children?: ReactNode;
};

/** Свёрнуто — карточка-кнопка с подписью; развёрнуто — «% / ₽», поле, результат, пояснение, «Убрать …». */
function AdjustmentCard({
	kind,
	adjustment,
	locked,
	currency,
	result,
	error,
	note,
	onOpen,
	onRemove,
	onUnit,
	onValue,
	children,
}: CardProps) {
	const { t } = useTranslation(CREATE_BILL_NS);
	const fieldId = useId();
	const title = t(kind === "discount" ? "discountTitle" : "tipsTitle");
	const percent = adjustment.unit === "percent";
	const Icon = kind === "discount" ? Percent : Coins;

	if (!adjustment.open) {
		return (
			<button
				type="button"
				onClick={onOpen}
				className="bg-card shadow-card flex min-h-15 w-full items-center gap-3 rounded-[18px] py-2 pr-4 pl-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
			>
				<span
					aria-hidden="true"
					className="text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-xl bg-(--field-bg,var(--background))"
				>
					<Icon className="size-5" strokeWidth={2} />
				</span>
				<span className="flex min-w-0 flex-1 flex-col">
					<span className="text-[15px] leading-5 font-semibold">{title}</span>
					<span className="text-caption text-muted-foreground">
						{t(kind === "discount" ? "discountSub" : "tipsSub")}
					</span>
				</span>
				<Plus className="text-accent size-5 shrink-0" strokeWidth={2.4} aria-hidden="true" />
			</button>
		);
	}

	return (
		<section
			aria-label={title}
			className={cn(
				"flex flex-col gap-2.5 rounded-[22px] p-3.5",
				locked ? "shadow-[inset_0_0_0_1px_var(--border)]" : "bg-card shadow-card",
			)}
		>
			<div className="flex min-h-6 items-center gap-2">
				<h3 className="min-w-0 flex-1 text-[15px] leading-5 font-semibold">{title}</h3>
				{locked ? null : (
					<button
						type="button"
						onClick={onRemove}
						className="text-accent -my-2.5 -mr-2 min-h-11 shrink-0 rounded-md px-2 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						{t(kind === "discount" ? "discountRemove" : "tipsRemove")}
					</button>
				)}
			</div>
			<div className="flex items-center gap-2">
				<SegmentedControl
					aria-label={t(kind === "discount" ? "discountUnits" : "tipsUnits")}
					value={adjustment.unit}
					onValueChange={(unit) => onUnit(unit as BillAdjustmentUnit)}
					disabled={locked}
					className="w-[100px] shrink-0 gap-0.5 rounded-[14px] p-0.5"
				>
					<SegmentedControlItem
						value="percent"
						aria-label={t("unitPercent")}
						className="min-h-11 rounded-[12px] px-0 text-base"
					>
						%
					</SegmentedControlItem>
					<SegmentedControlItem
						value="amount"
						aria-label={t("unitAmount")}
						className="min-h-11 rounded-[12px] px-0 text-base"
					>
						{currency}
					</SegmentedControlItem>
				</SegmentedControl>
				<div
					className={cn(
						"flex h-12 min-w-0 flex-1 items-center gap-1 rounded-[14px] px-3",
						locked ? "shadow-[inset_0_0_0_1px_var(--border)]" : "bg-(--field-bg,var(--background))",
						error ? "shadow-[inset_0_0_0_2px_var(--destructive)]" : "focus-within:shadow-[inset_0_0_0_2px_var(--ring)]",
					)}
				>
					<label htmlFor={fieldId} className="sr-only">
						{t(
							kind === "discount"
								? percent
									? "discountFieldPercent"
									: "discountFieldAmount"
								: percent
									? "tipsFieldPercent"
									: "tipsFieldAmount",
						)}
					</label>
					<AmountInput
						id={fieldId}
						value={adjustment.value}
						onValueChange={onValue}
						placeholder="0"
						disabled={locked}
						aria-invalid={error || undefined}
						className="h-auto min-h-0 min-w-0 flex-1 bg-transparent px-0 text-right text-[17px] font-semibold shadow-none focus-visible:shadow-none disabled:bg-transparent disabled:shadow-none disabled:text-muted-foreground"
					/>
					<span className="text-muted-foreground font-semibold">{percent ? "%" : currency}</span>
				</div>
				<span
					role="status"
					className={cn(
						"min-w-[84px] shrink-0 text-right text-base font-semibold whitespace-nowrap tabular-nums",
						(locked || !result || error) && "text-muted-foreground",
						error && "line-through",
					)}
				>
					{result ?? "—"}
				</span>
			</div>
			<Note error={error}>{note}</Note>
			{children}
		</section>
	);
}

/** Пояснение под полем или отметками: одна строка с многоточием, ошибка — с иконкой. */
function Note({ error, children }: { error: boolean; children: ReactNode }) {
	return (
		<p
			className={cn(
				"text-caption m-0 flex h-[18px] items-center gap-1.5 overflow-hidden whitespace-nowrap",
				error ? "text-destructive font-medium" : "text-muted-foreground",
			)}
		>
			{error ? <CircleAlert className="size-[15px] shrink-0" strokeWidth={2.2} aria-hidden="true" /> : null}
			<span className="min-w-0 truncate">{children}</span>
		</p>
	);
}
