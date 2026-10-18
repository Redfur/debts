import { Check, ChevronRight, Plus, X } from "lucide-react";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import { AmountInput } from "@/components/ui/amount-input";
import { Input } from "@/components/ui/input";
import { SegmentedControl, SegmentedControlItem } from "@/components/ui/segmented-control";
import { fromCents, ME_REF, ParticipantAvatar, toCents, useParticipantName } from "@/entities/debt";
import { CURRENCY_SHORT_LABEL } from "@/shared/config/currencies";
import { formatAmount, formatMoney } from "@/shared/lib/format-amount";
import { cn } from "@/shared/lib/utils";
import { AmountField } from "@/shared/ui/amount-field";
import { CurrencyPicker } from "@/shared/ui/currency-picker";
import { FieldError } from "@/shared/ui/form-message";
import type { BillFormApi, PayerMode } from "../model/use-bill-form";
import { CREATE_BILL_NS } from "../translations";

type Props = {
	form: BillFormApi;
	/** После погашений: всё, кроме «За что», только для чтения. */
	locked: boolean;
	/** Показать ошибки шага (после «Далее» или «Сохранить»). */
	showErrors: boolean;
	onAddParticipants: () => void;
	onChangePayer: () => void;
};

/**
 * «Сколько и кто платил»: сумма и валюта, «За что», участники, «Кто заплатил». «По чеку» вместо поля суммы — итог
 * позиций, плательщик всегда один.
 */
export function BillBasicsSection({ form, locked, showErrors, onAddParticipants, onChangePayer }: Props) {
	const { t } = useTranslation(CREATE_BILL_NS);
	const nameOf = useParticipantName();
	const amountId = useId();
	const amountErrorId = useId();
	const titleId = useId();
	const participantsLabelId = useId();
	const participantsErrorId = useId();
	const payerLabelId = useId();
	const { state, validation } = form;
	const receipt = state.entry === "receipt";
	const total = receipt ? form.draft.totalAmount : Number(state.amount) || 0;
	const amountError = showErrors && validation.errors.includes("amount_required");
	const participantsError = showErrors && validation.errors.includes("participants_min");

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-1.5">
				<div
					className={cn(
						"bg-card shadow-card flex flex-col overflow-hidden rounded-card",
						locked && "shadow-[inset_0_0_0_1px_var(--border)] bg-transparent",
					)}
				>
					{receipt ? (
						<div role="status" aria-live="polite" className="flex items-center gap-2.5 py-3.5 pr-2.5 pl-5">
							<span className="flex min-w-0 flex-1 flex-col gap-0.5">
								<span className="text-caption text-muted-foreground">{t("receiptTotalLabel")}</span>
								<span
									className={cn(
										"text-[40px] leading-12 font-bold tracking-[-0.03em] whitespace-nowrap tabular-nums",
										locked && "text-muted-foreground",
									)}
								>
									{formatMoney(fromCents(toCents(total)), state.currency)}
								</span>
								<span className="text-caption text-muted-foreground">{t("receiptTotalHint")}</span>
							</span>
							<CurrencyPicker
								value={state.currency}
								onChange={form.setCurrency}
								title={t("currencyTitle")}
								triggerLabel={t("currencyLabel", { name: CURRENCY_SHORT_LABEL[state.currency].toLowerCase() })}
								disabled={locked}
								triggerClassName="self-start mt-4.5"
							/>
						</div>
					) : (
						<AmountField
							id={amountId}
							label={t("amountLabel")}
							value={state.amount}
							onValueChange={form.setAmount}
							currency={state.currency}
							onCurrencyChange={form.setCurrency}
							currencyTitle={t("currencyTitle")}
							currencyLabel={(name) => t("currencyLabel", { name })}
							invalid={amountError}
							describedBy={amountError ? amountErrorId : undefined}
							disabled={locked}
							surface="plain"
						/>
					)}
					<div className="bg-border ml-5 h-px" />
					<label htmlFor={titleId} className="sr-only">
						{t("titleLabel")}
					</label>
					<Input
						id={titleId}
						value={state.title}
						onChange={(e) => form.setTitle(e.target.value)}
						placeholder={t(receipt ? "titlePlaceholderReceipt" : "titlePlaceholder")}
						enterKeyHint="done"
						className="min-h-13 rounded-none bg-transparent px-5 shadow-none focus-visible:shadow-[inset_0_0_0_2px_var(--ring)]"
					/>
				</div>
				{amountError ? <FieldError id={amountErrorId}>{t("errorAmount")}</FieldError> : null}
			</div>

			<div className="flex flex-col gap-2">
				<span id={participantsLabelId} className="text-caption text-muted-foreground pl-1 font-semibold">
					{t("participants", { count: state.participants.length })}
				</span>
				<ul aria-labelledby={participantsLabelId} className="flex flex-wrap gap-2">
					{state.participants.map(({ ref }) => {
						const removable = ref !== ME_REF && !locked;
						return (
							<li
								key={ref}
								className={cn(
									"bg-card shadow-card flex min-h-11 max-w-full items-center gap-2 rounded-full pl-1.5 text-[15px] font-medium",
									removable ? "pr-0.5" : "pr-3.5",
									locked && "text-muted-foreground",
								)}
							>
								<ParticipantAvatar participantRef={ref} className="size-8 text-[13px]" />
								<span className="max-w-[220px] min-w-0 truncate">{nameOf(ref)}</span>
								{removable ? (
									<button
										type="button"
										aria-label={t("removeParticipant", { name: nameOf(ref) })}
										onClick={() => form.removeParticipant(ref)}
										className="text-muted-foreground hover:text-foreground flex size-10 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
									>
										<X className="size-4" strokeWidth={2.2} />
									</button>
								) : null}
							</li>
						);
					})}
					{locked ? null : (
						<li>
							<button
								type="button"
								onClick={onAddParticipants}
								className="border-muted-foreground/50 text-accent flex min-h-11 items-center gap-1.5 rounded-full border-[1.5px] border-dashed pr-4 pl-3 text-[15px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring"
							>
								<Plus className="size-[18px]" strokeWidth={2.4} aria-hidden="true" />
								{t("addParticipant")}
							</button>
						</li>
					)}
				</ul>
				{participantsError ? <FieldError id={participantsErrorId}>{t("errorParticipants")}</FieldError> : null}
			</div>

			<div className="flex flex-col gap-2">
				<span id={payerLabelId} className="text-caption text-muted-foreground pl-1 font-semibold">
					{t("payerLabel")}
				</span>
				{receipt ? null : (
					<SegmentedControl
						aria-labelledby={payerLabelId}
						value={state.payerMode}
						onValueChange={(mode) => form.setPayerMode(mode === "several" ? "several" : "one")}
						disabled={locked}
						className="rounded-[18px]"
					>
						{(["one", "several"] satisfies PayerMode[]).map((mode) => (
							<SegmentedControlItem key={mode} value={mode} className="min-h-11 rounded-[14px] text-[15px]">
								{t(mode === "one" ? "payerOne" : "payerSeveral")}
							</SegmentedControlItem>
						))}
					</SegmentedControl>
				)}

				{state.payerMode === "one" ? (
					<SinglePayer
						name={nameOf(state.payerRef)}
						participantRef={state.payerRef}
						whole={
							total > 0
								? t(receipt ? "payerWholeReceiptAmount" : "payerWholeAmount", {
										amount: formatMoney(total, state.currency),
									})
								: t(receipt ? "payerWholeReceipt" : "payerWhole")
						}
						locked={locked}
						onChange={onChangePayer}
					/>
				) : (
					<SeveralPayers form={form} locked={locked} />
				)}
			</div>
		</div>
	);
}

type SinglePayerProps = {
	name: string;
	participantRef: string;
	whole: string;
	locked: boolean;
	onChange: () => void;
};

/** «<имя> · вся сумма · <сумма>» и «Сменить» — открывает шторку «Кто заплатил». */
function SinglePayer({ name, participantRef, whole, locked, onChange }: SinglePayerProps) {
	const { t } = useTranslation(CREATE_BILL_NS);
	const body = (
		<>
			<ParticipantAvatar participantRef={participantRef} className="size-9 text-sm" />
			<span className="flex min-w-0 flex-1 flex-col text-left">
				<span className="text-body truncate font-medium">{name}</span>
				<span className="text-caption text-muted-foreground">{whole}</span>
			</span>
		</>
	);
	if (locked) {
		return (
			<div className="text-muted-foreground flex min-h-16 items-center gap-3 rounded-[18px] px-3.5 py-2.5 shadow-[inset_0_0_0_1px_var(--border)]">
				{body}
			</div>
		);
	}
	return (
		<button
			type="button"
			onClick={onChange}
			aria-label={t("payerChangeA11y", { name, whole })}
			className="bg-card shadow-card flex min-h-16 items-center gap-3 rounded-[18px] py-2.5 pr-3 pl-3.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
		>
			{body}
			<span className="text-accent flex items-center gap-0.5 text-sm font-medium">
				{t("payerChange")}
				<ChevronRight className="size-4" strokeWidth={2.2} aria-hidden="true" />
			</span>
		</button>
	);
}

/** Поле оплаты у каждого участника, «Оплачено X из Y» с полосой и «Осталось X». */
function SeveralPayers({ form, locked }: { form: BillFormApi; locked: boolean }) {
	const { t } = useTranslation(CREATE_BILL_NS);
	const nameOf = useParticipantName();
	const fieldId = useId();
	const { state, validation } = form;
	const totalCents = toCents(Number(state.amount) || 0);
	const paidCents = totalCents - validation.paidRemainingCents;
	const full = totalCents > 0 && validation.paidRemainingCents === 0;
	const percent = totalCents > 0 ? Math.min(100, Math.max(0, (paidCents / totalCents) * 100)) : 0;
	const money = (cents: number) => formatMoney(cents / 100, state.currency);

	return (
		<div className="bg-card shadow-card overflow-hidden rounded-[22px]">
			<ul className="py-1">
				{state.participants.map(({ ref, paid }, index) => (
					<li key={ref} className={cn("flex min-h-16 items-center gap-3 pr-3 pl-4", index > 0 && "border-t")}>
						<ParticipantAvatar participantRef={ref} className="size-9 text-sm" />
						<span className="text-body min-w-0 flex-1 truncate font-medium">{nameOf(ref)}</span>
						<div className="bg-(--field-bg,var(--background)) focus-within:shadow-[inset_0_0_0_2px_var(--ring)] flex min-h-12 w-[124px] shrink-0 items-center gap-1 rounded-[14px] px-3">
							<label htmlFor={`${fieldId}-${ref}`} className="sr-only">
								{t("paidA11y", { name: nameOf(ref) })}
							</label>
							<AmountInput
								id={`${fieldId}-${ref}`}
								value={paid}
								onValueChange={(raw) => form.setPaid(ref, raw)}
								placeholder="0"
								disabled={locked}
								className="h-auto min-h-0 min-w-0 flex-1 bg-transparent px-0 text-right text-[17px] font-semibold shadow-none focus-visible:shadow-none"
							/>
						</div>
					</li>
				))}
			</ul>
			<div role="status" className="flex flex-col gap-2 border-t px-4 pt-3 pb-4">
				<div className="text-caption flex justify-between gap-2">
					<span className="text-muted-foreground">{t("paid")}</span>
					<span className={cn("flex items-center gap-1 font-semibold tabular-nums", full && "text-owed-to-me-strong")}>
						{full ? <Check className="size-3.5" strokeWidth={2.8} aria-hidden="true" /> : null}
						{t("ofTotal", { done: formatAmount(paidCents / 100), total: money(totalCents) })}
					</span>
				</div>
				<div aria-hidden="true" className="bg-secondary flex h-2 overflow-hidden rounded-full">
					<span
						className={cn("rounded-full", full ? "bg-owed-to-me" : "bg-warning")}
						style={{ width: `${percent}%` }}
					/>
				</div>
				{!full && totalCents > 0 && validation.paidRemainingCents > 0 ? (
					<span className="text-warning text-sm font-semibold">
						{t("paidLeft", { amount: money(validation.paidRemainingCents) })}
					</span>
				) : null}
			</div>
		</div>
	);
}
