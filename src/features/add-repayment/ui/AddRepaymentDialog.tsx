import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { type FormEvent, useEffect, useId, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { AmountInput } from "@/components/ui/amount-input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { computeDebtBalance, useDebtOperations, useDebtStore } from "@/entities/debt";
import { CURRENCY_SYMBOL } from "@/shared/config/currencies";
import { COMMON_NS } from "@/shared/i18n";
import { formatMoney } from "@/shared/lib/format-amount";
import { roundAmount } from "@/shared/lib/round-amount";
import { cn } from "@/shared/lib/utils";
import { FieldError, FormAlert } from "@/shared/ui/form-message";
import { useAddRepayment } from "../model/use-add-repayment";
import { ADD_REPAYMENT_NS } from "../translations";

type Props = {
	debtId: string;
};

type Errors = { amount?: string; form?: string };

const AddRepaymentDialogComponent = NiceModal.create(({ debtId }: Props) => {
	const { t } = useTranslation(ADD_REPAYMENT_NS);
	const { t: tCommon } = useTranslation(COMMON_NS);
	const modal = useModal();
	const { submit, pending } = useAddRepayment();
	const amountId = useId();
	const amountErrorId = useId();
	const remainingId = useId();
	const noteId = useId();

	const debt = useDebtStore((s) => s.debtsById[debtId]);
	const contactName = useDebtStore((s) => (debt ? s.contactsById[debt.contactId]?.name : undefined));
	const operations = useDebtOperations(debtId);
	const balance = debt ? computeDebtBalance(debt, operations) : 0;

	const [amount, setAmount] = useState("");
	const [note, setNote] = useState("");
	const [errors, setErrors] = useState<Errors>({});

	// NiceModal может держать компонент смонтированным между показами — сбрасываем форму при открытии.
	useEffect(() => {
		if (!modal.visible) return;
		setAmount("");
		setNote("");
		setErrors({});
	}, [modal.visible]);

	const closeModal = async () => {
		await modal.hide();
		modal.remove();
	};

	const handleOpenChange = (open: boolean) => {
		if (open) return;
		void closeModal();
	};

	if (!debt) return null;

	const parsedAmount = Number(amount);
	const validAmount = amount !== "" && Number.isFinite(parsedAmount) && parsedAmount > 0;
	const left = Math.max(0, roundAmount(balance - (validAmount ? parsedAmount : 0)));

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!validAmount) {
			setErrors({ amount: t("errorAmountInvalid") });
			return;
		}
		if (parsedAmount > balance) {
			setErrors({ amount: t("errorExceedsBalance") });
			return;
		}
		setErrors({});
		const ok = await submit(debtId, parsedAmount, note.trim() || undefined);
		if (ok) await closeModal();
		else setErrors({ form: t("errorGeneric") });
	};

	return (
		<Dialog open={modal.visible} onOpenChange={handleOpenChange}>
			<DialogContent className="gap-3">
				<DialogHeader className="gap-0.5 px-1">
					<DialogTitle>{t("title")}</DialogTitle>
					<DialogDescription className="text-caption">
						{[debt.note || t("untitledDebt"), contactName].filter(Boolean).join(" · ")}
					</DialogDescription>
				</DialogHeader>
				<form noValidate className="flex flex-col gap-3" onSubmit={(e) => void handleSubmit(e)}>
					<div className="flex flex-col gap-2">
						<div
							className={cn(
								"bg-secondary flex min-h-16 items-center gap-1 rounded-control pr-4 pl-4.5 transition-shadow focus-within:shadow-[inset_0_0_0_2px_var(--ring)]",
								errors.amount &&
									"shadow-[inset_0_0_0_2px_var(--destructive)] focus-within:shadow-[inset_0_0_0_2px_var(--destructive)]",
							)}
						>
							<label htmlFor={amountId} className="sr-only">
								{t("amountLabel")}
							</label>
							<AmountInput
								id={amountId}
								placeholder="0"
								value={amount}
								onValueChange={(raw) => {
									setAmount(raw);
									if (errors.amount) setErrors({});
								}}
								aria-invalid={errors.amount ? true : undefined}
								aria-describedby={errors.amount ? `${amountErrorId} ${remainingId}` : remainingId}
								autoComplete="off"
								className="caret-accent placeholder:text-muted-foreground/60 text-amount-xl h-10 min-h-0 flex-1 rounded-none bg-transparent px-0 focus-visible:shadow-none aria-invalid:shadow-none lg:text-amount-xl"
							/>
							<span aria-hidden="true" className="text-muted-foreground text-2xl font-semibold">
								{CURRENCY_SYMBOL[debt.currency]}
							</span>
						</div>
						{errors.amount ? <FieldError id={amountErrorId}>{errors.amount}</FieldError> : null}
						<div className="flex items-center justify-between gap-2 px-1">
							<span id={remainingId} className="text-caption text-muted-foreground">
								<Trans
									t={t}
									i18nKey="remaining"
									values={{
										balance: formatMoney(balance, debt.currency),
										left: formatMoney(left, debt.currency),
									}}
									components={{ b: <b className="text-foreground font-semibold" /> }}
								/>
							</span>
							<button
								type="button"
								onClick={() => {
									setAmount(String(balance));
									setErrors({});
								}}
								className={cn(
									"touch-target min-h-9 shrink-0 rounded-full px-3 text-[13px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring",
									debt.direction === "owed_to_me"
										? "bg-owed-to-me-muted text-owed-to-me-strong"
										: "bg-i-owe-muted text-i-owe-strong",
								)}
							>
								{t("repayAll")}
							</button>
						</div>
					</div>

					<div className="flex flex-col gap-1.5">
						<label htmlFor={noteId} className="text-caption text-muted-foreground pl-1">
							{t("noteLabel")}
						</label>
						<Input
							id={noteId}
							value={note}
							onChange={(e) => setNote(e.target.value)}
							placeholder={t("notePlaceholder")}
							enterKeyHint="done"
							className="rounded-[16px] px-4"
						/>
					</div>

					{errors.form ? <FormAlert>{errors.form}</FormAlert> : null}

					<div className="mt-1 flex gap-2">
						<Button type="button" variant="secondary" size="lg" className="flex-1" onClick={() => void closeModal()}>
							{tCommon("cancel")}
						</Button>
						<Button type="submit" variant="accent" size="lg" className="flex-[2]" disabled={pending}>
							{tCommon("save")}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
});

export function showAddRepaymentDialog(props: Props) {
	return NiceModal.show(AddRepaymentDialogComponent, props);
}
