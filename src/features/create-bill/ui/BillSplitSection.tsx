import { Check, Minus, Plus } from "lucide-react";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import { AmountInput } from "@/components/ui/amount-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { SegmentedControl, SegmentedControlItem } from "@/components/ui/segmented-control";
import {
	type BillSplitMode,
	fromCents,
	ME_REF,
	ParticipantAvatar,
	TransferList,
	toCents,
	useParticipantName,
} from "@/entities/debt";
import { formatAmount, formatMoney } from "@/shared/lib/format-amount";
import { formatPeopleCount } from "@/shared/lib/format-people-count";
import type { CurrencyCode } from "@/shared/lib/storage";
import { cn } from "@/shared/lib/utils";
import { describeConsequences, describeParticipant, type ParticipantOutcome } from "../model/describe-bill";
import type { BillFormApi } from "../model/use-bill-form";
import { CREATE_BILL_NS } from "../translations";

const MODES: readonly { mode: BillSplitMode; labelKey: "splitEqual" | "splitShares" | "splitAmounts" }[] = [
	{ mode: "equal", labelKey: "splitEqual" },
	{ mode: "shares", labelKey: "splitShares" },
	{ mode: "amounts", labelKey: "splitAmounts" },
];

/** «Как делим»: способ деления, участники деления, распределение, «Кто кому переводит» и сводка последствий. */
export function BillSplitSection({ form }: { form: BillFormApi }) {
	const { t } = useTranslation(CREATE_BILL_NS);
	const fieldId = useId();
	const nameOf = useParticipantName();
	const { state, draft, shares, transfers, validation } = form;
	const currency = state.currency;
	const money = (cents: number) => formatMoney(fromCents(cents), currency);
	const complete = transfers !== null && validation.splitRemainingCents === 0;

	const captionOf = (index: number): { text: string; tone: "in" | "out" | "muted" } | null => {
		const participant = draft.participants[index];
		const ref = participant.ref;
		const excluded =
			state.splitMode === "equal" ? !participant.inSplit : !shares.inSplit[index] && participant.paid === 0;
		if (excluded) return { text: t(ref === ME_REF ? "notSplittingMe" : "notSplitting"), tone: "muted" };
		if (!complete || !transfers) return null;
		const parts = describeParticipant(ref, transfers);
		const text = parts.map((part) => outcomeText(part)).join(" · ");
		const first = parts[0].kind;
		return { text, tone: first === "toMe" ? "in" : first === "fromMe" ? "out" : "muted" };
	};

	const outcomeText = (part: ParticipantOutcome): string => {
		switch (part.kind) {
			case "toMe":
				return t("captionToMe");
			case "fromMe":
				return t("captionFromMe");
			case "with":
				return t("captionWith", { names: part.refs.map(nameOf).join(", ") });
			case "settled":
				return t("captionSettled");
			case "myShare":
				return t("captionMyShare");
		}
	};

	const totalShares = state.participants.reduce((acc, p) => acc + p.shares, 0);
	const splitCount = shares.inSplit.filter(Boolean).length;

	return (
		<div className="flex flex-col gap-4">
			<SegmentedControl
				aria-label={t("splitLabel")}
				value={state.splitMode}
				onValueChange={(mode) => form.setSplitMode(MODES.find((m) => m.mode === mode)?.mode ?? "equal")}
				className="rounded-[18px]"
			>
				{MODES.map(({ mode, labelKey }) => (
					<SegmentedControlItem key={mode} value={mode} className="min-h-11 rounded-[14px] text-[15px]">
						{t(labelKey)}
					</SegmentedControlItem>
				))}
			</SegmentedControl>

			<ul aria-label={t("splitParticipants")} className="bg-card shadow-card rounded-[22px] py-1">
				{state.participants.map((p, index) => {
					const name = nameOf(p.ref);
					const caption = captionOf(index);
					const excludedEqual = state.splitMode === "equal" && !p.inSplit;
					return (
						<li key={p.ref} className={cn("flex min-h-16 items-center gap-3 py-2 pr-3 pl-4", index > 0 && "border-t")}>
							{state.splitMode === "equal" ? (
								<Checkbox
									checked={p.inSplit}
									onCheckedChange={(checked) => form.setInSplit(p.ref, checked === true)}
									aria-label={p.ref === ME_REF ? t("splitsMe") : t("splitsContact", { name })}
								/>
							) : null}
							<ParticipantAvatar
								participantRef={p.ref}
								muted={excludedEqual || !shares.inSplit[index]}
								className="size-9 text-sm"
							/>
							<span className="flex min-w-0 flex-1 flex-col">
								<span className="text-body truncate font-medium">{name}</span>
								{state.splitMode === "shares" ? (
									<span className="text-sm leading-5 font-semibold tabular-nums">
										{p.shares > 0 ? money(shares.cents[index]) : t("sharesZero")}
									</span>
								) : null}
								{caption ? (
									<span
										className={cn(
											"text-caption",
											caption.tone === "in" && "text-owed-to-me-strong font-medium",
											caption.tone === "out" && "text-i-owe-strong font-medium",
											caption.tone === "muted" && "text-muted-foreground",
										)}
									>
										{caption.text}
									</span>
								) : null}
							</span>
							{state.splitMode === "equal" ? (
								<span
									className={cn(
										"text-body shrink-0 font-semibold whitespace-nowrap tabular-nums",
										!p.inSplit && "text-muted-foreground",
									)}
								>
									{p.inSplit ? money(shares.cents[index]) : "—"}
								</span>
							) : null}
							{state.splitMode === "shares" ? (
								<fieldset
									aria-label={t("sharesGroup", { name })}
									className="bg-(--field-bg,var(--background)) flex shrink-0 items-center rounded-full"
								>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										aria-label={t("sharesLess")}
										disabled={p.shares === 0}
										onClick={() => form.setShares(p.ref, p.shares - 1)}
										className="disabled:bg-transparent"
									>
										<Minus className="size-5" />
									</Button>
									<span aria-live="polite" className="min-w-[22px] text-center text-[17px] font-semibold tabular-nums">
										{p.shares}
									</span>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										aria-label={t("sharesMore")}
										onClick={() => form.setShares(p.ref, p.shares + 1)}
									>
										<Plus className="size-5" />
									</Button>
								</fieldset>
							) : null}
							{state.splitMode === "amounts" ? (
								<div className="bg-(--field-bg,var(--background)) focus-within:shadow-[inset_0_0_0_2px_var(--ring)] flex min-h-12 w-[124px] shrink-0 items-center gap-1 rounded-[14px] px-3">
									<label htmlFor={`${fieldId}-${p.ref}`} className="sr-only">
										{t("amountA11y", { name })}
									</label>
									<AmountInput
										id={`${fieldId}-${p.ref}`}
										value={p.amount}
										onValueChange={(raw) => form.setSplitAmount(p.ref, raw)}
										placeholder="0"
										className="h-auto min-h-0 min-w-0 flex-1 bg-transparent px-0 text-right text-[17px] font-semibold shadow-none focus-visible:shadow-none"
									/>
								</div>
							) : null}
						</li>
					);
				})}
			</ul>

			{state.splitMode === "shares" && totalShares > 0 && toCents(draft.totalAmount) > 0 ? (
				<p className="text-caption text-muted-foreground px-1">
					{t("sharesTotal", {
						count: totalShares,
						amount: formatMoney(draft.totalAmount / totalShares, currency),
					})}
				</p>
			) : null}

			<DistributionStatus
				form={form}
				currency={currency}
				leftoverNote={
					shares.leftoverCents > 0 && state.splitMode === "equal"
						? t("indivisible", {
								amount: formatMoney(draft.totalAmount, currency),
								people: formatPeopleCount(splitCount),
							})
						: null
				}
			/>

			{complete && transfers ? (
				<>
					<section className="bg-card shadow-card rounded-[22px] px-4 pt-1 pb-1.5">
						<h2 className="pt-3 pb-0.5 text-[15px] leading-5 font-semibold">
							{t("transfers")} <span className="text-muted-foreground font-medium">{transfers.length || null}</span>
						</h2>
						{transfers.length > 0 ? (
							<div className="pt-1.5">
								<TransferList transfers={transfers} currency={currency} compact />
							</div>
						) : (
							<p className="text-caption text-muted-foreground pb-2.5">{t("noTransfers")}</p>
						)}
					</section>
					<BillConsequencesBox form={form} />
				</>
			) : (
				<p className="text-muted-foreground rounded-[18px] px-4 py-3.5 text-sm shadow-[inset_0_0_0_1px_var(--border)]">
					{t("transfersPending")}
				</p>
			)}
		</div>
	);
}

type StatusProps = { form: BillFormApi; currency: CurrencyCode; leftoverNote: string | null };

/** «Распределено X из Y» с полосой; остаток с «Раскидать поровну» / «Отменить»; перебор; неделимая копейка. */
function DistributionStatus({ form, currency, leftoverNote }: StatusProps) {
	const { t } = useTranslation(CREATE_BILL_NS);
	const { draft, validation, spreadUndo, state } = form;
	const totalCents = toCents(draft.totalAmount);
	const remaining = validation.splitRemainingCents;
	const doneCents = totalCents - remaining;
	const full = totalCents > 0 && remaining === 0;
	const percent = totalCents > 0 ? Math.min(100, Math.max(0, (doneCents / totalCents) * 100)) : 0;

	return (
		<div role="status" className="flex flex-col gap-2 px-1">
			<div className="text-caption flex justify-between gap-2">
				<span className="text-muted-foreground">{t("distributed")}</span>
				<span
					className={cn(
						"flex items-center gap-1 font-semibold tabular-nums",
						full && "text-owed-to-me-strong",
						remaining < 0 && "text-destructive",
					)}
				>
					{full ? <Check className="size-3.5" strokeWidth={2.8} aria-hidden="true" /> : null}
					{t("ofTotal", { done: formatAmount(fromCents(doneCents)), total: formatMoney(draft.totalAmount, currency) })}
				</span>
			</div>
			<div aria-hidden="true" className="bg-secondary flex h-2 overflow-hidden rounded-full">
				<span
					className={cn("rounded-full", full ? "bg-owed-to-me" : remaining < 0 ? "bg-destructive" : "bg-warning")}
					style={{ width: `${remaining < 0 ? 100 : percent}%` }}
				/>
			</div>
			{totalCents > 0 && remaining > 0 ? (
				<div className="mt-0.5 flex items-center justify-between gap-2">
					<span className="text-warning text-sm font-semibold">
						{t("remaining", { amount: formatMoney(fromCents(remaining), currency) })}
					</span>
					{state.splitMode === "amounts" ? (
						<Button
							type="button"
							size="default"
							className="bg-warning-muted text-warning hover:bg-warning-muted/80 shrink-0 px-3.5 text-[13px]"
							onClick={form.spreadRemainder}
						>
							{t("spread")}
						</Button>
					) : null}
				</div>
			) : null}
			{remaining < 0 ? (
				<span className="text-destructive text-sm font-semibold">
					{t("over", { amount: formatMoney(fromCents(-remaining), currency) })}
				</span>
			) : null}
			{spreadUndo ? (
				<span className="text-caption text-muted-foreground flex items-center justify-between gap-2">
					{t("spreadDone", { amount: formatMoney(spreadUndo.remainder, currency) })}
					<button
						type="button"
						onClick={form.undoSpread}
						className="text-accent min-h-11 rounded-md px-1 font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						{t("undo")}
					</button>
				</span>
			) : null}
			{leftoverNote ? <span className="text-caption text-muted-foreground mt-0.5">{leftoverNote}</span> : null}
		</div>
	);
}

/** Сводка последствий: «Появятся N долгов» с перечнем или «Ваши долги не изменятся». */
function BillConsequencesBox({ form }: { form: BillFormApi }) {
	const { t } = useTranslation(CREATE_BILL_NS);
	const nameOf = useParticipantName();
	const { transfers, draft, shares, state } = form;
	if (!transfers) return null;
	const { owedToMe, iOwe, hasOthers } = describeConsequences(transfers);
	const count = owedToMe.length + iOwe.length;
	const money = (amount: number) => formatMoney(amount, state.currency);

	const describe = (items: { ref: string; amount: number }[], sameKey: "summaryOwedToMeSame" | "summaryIOweSame") => {
		const same = items.length > 1 && items.every((item) => item.amount === items[0].amount);
		if (same) return t(sameKey, { names: items.map((i) => nameOf(i.ref)).join(", "), amount: money(items[0].amount) });
		const list = items.map((i) => t("summaryItem", { name: nameOf(i.ref), amount: money(i.amount) })).join(", ");
		return t(sameKey === "summaryOwedToMeSame" ? "summaryOwedToMe" : "summaryIOwe", { list });
	};

	if (count === 0) {
		const meIndex = draft.participants.findIndex((p) => p.ref === ME_REF);
		const meActive = meIndex >= 0 && (draft.participants[meIndex].paid > 0 || shares.inSplit[meIndex]);
		return (
			<div className="flex flex-col gap-0.5 rounded-[18px] px-4 py-3.5 shadow-[inset_0_0_0_1px_var(--border)]">
				<b className="text-[15px] leading-5 font-semibold">{t("summaryNone")}</b>
				<span className="text-sm">{t(meActive ? "summaryNoneInside" : "summaryNoneOutside")}</span>
			</div>
		);
	}

	const lines = [
		owedToMe.length > 0 ? describe(owedToMe, "summaryOwedToMeSame") : null,
		iOwe.length > 0 ? describe(iOwe, "summaryIOweSame") : null,
		hasOthers ? t("summaryOthers") : null,
	].filter((line) => line !== null);

	return (
		<div className="bg-accent-muted text-accent-strong flex flex-col gap-0.5 rounded-[18px] px-4 py-3.5">
			<b className="text-[15px] leading-5 font-semibold">
				{count === 1 ? t("summaryOneDebt") : t("summaryDebts", { count })}
			</b>
			<span className="text-sm">{lines.join(" ")}</span>
		</div>
	);
}
