import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { Info, ReceiptText } from "lucide-react";
import { type FormEvent, type ReactNode, useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DirectionToggle, ENTITY_DEBT_NS, useDebtOperations, useDebtStore } from "@/entities/debt";
import { COMMON_NS } from "@/shared/i18n";
import { formatMoney } from "@/shared/lib/format-amount";
import type { CurrencyCode, DebtDirection } from "@/shared/lib/storage";
import { AmountField } from "@/shared/ui/amount-field";
import { FieldError, FormAlert } from "@/shared/ui/form-message";
import { useEditDebt } from "../model/use-edit-debt";
import { EDIT_DEBT_NS } from "../translations";

type Props = {
	debtId: string;
	/** «Открыть счёт» у долга из счёта: шторка рендерится вне роутера, переход делает вызывающий экран. */
	onOpenBill?: (billId: string) => void;
};

type Errors = { amount?: string; form?: string };

/** Поле только для чтения (направление и сумма после погашений). */
function ReadOnlyTile({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div
			aria-disabled="true"
			className="flex flex-col gap-1 rounded-[16px] px-3.5 py-3 shadow-[inset_0_0_0_1px_var(--border)]"
		>
			<span className="text-muted-foreground text-xs">{label}</span>
			<span className="text-muted-foreground text-[15px] leading-5 font-semibold">{children}</span>
		</div>
	);
}

const EditDebtDialogComponent = NiceModal.create(({ debtId, onOpenBill }: Props) => {
	const { t } = useTranslation(EDIT_DEBT_NS);
	const { t: tCommon } = useTranslation(COMMON_NS);
	const { t: tDebt } = useTranslation(ENTITY_DEBT_NS);
	const modal = useModal();
	const { submit, pending } = useEditDebt();
	const amountId = useId();
	const amountErrorId = useId();
	const noteId = useId();

	const debt = useDebtStore((s) => s.debtsById[debtId]);
	const contactName = useDebtStore((s) => (debt ? s.contactsById[debt.contactId]?.name : undefined));
	const operations = useDebtOperations(debtId);
	const bill = useDebtStore((s) => (debt?.billId ? s.billsById[debt.billId] : undefined));
	// Долг из счёта: направление, сумма и валюта меняются только через счёт.
	const locked = Boolean(bill) || operations.some((op) => op.kind === "repayment");

	const [direction, setDirection] = useState<DebtDirection>("owed_to_me");
	const [currency, setCurrency] = useState<CurrencyCode>("RUB");
	const [amount, setAmount] = useState("");
	const [note, setNote] = useState("");
	const [errors, setErrors] = useState<Errors>({});

	// NiceModal может держать компонент смонтированным между показами — сбрасываем форму при открытии.
	// Читаем долг напрямую из стора (а не из реактивного `debt`), чтобы не сбрасывать
	// уже введённые значения при фоновых обновлениях стора, пока диалог открыт.
	useEffect(() => {
		if (!modal.visible) return;
		const current = useDebtStore.getState().debtsById[debtId];
		if (!current) return;
		setDirection(current.direction);
		setCurrency(current.currency);
		setAmount(String(current.principalAmount));
		setNote(current.note ?? "");
		setErrors({});
	}, [modal.visible, debtId]);

	const closeModal = async () => {
		await modal.hide();
		modal.remove();
	};

	const handleOpenChange = (open: boolean) => {
		if (open) return;
		void closeModal();
	};

	if (!debt) return null;

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		const patch: Parameters<typeof submit>[1] = { note: note.trim() || undefined };
		if (!locked) {
			const parsedAmount = Number(amount);
			if (amount === "" || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
				setErrors({ amount: t("errorAmountInvalid") });
				return;
			}
			patch.amount = parsedAmount;
			patch.direction = direction;
			patch.currency = currency;
		}
		setErrors({});
		const ok = await submit(debtId, patch);
		if (ok) await closeModal();
		else setErrors({ form: t("errorGeneric") });
	};

	return (
		<Dialog open={modal.visible} onOpenChange={handleOpenChange}>
			<DialogContent className="gap-3.5">
				<DialogHeader className="gap-0.5 px-1">
					<DialogTitle>{t("title")}</DialogTitle>
					<DialogDescription className="text-caption">{contactName}</DialogDescription>
				</DialogHeader>
				<form noValidate className="flex flex-col gap-3.5" onSubmit={(e) => void handleSubmit(e)}>
					{locked ? (
						<>
							<div className="bg-secondary text-muted-foreground flex gap-2.5 rounded-[16px] px-3.5 py-3">
								<Info className="mt-px size-4 shrink-0" aria-hidden="true" />
								<span className="text-caption">
									{bill ? t("billHint", { title: bill.title ?? t("untitledBill") }) : t("lockedHint")}
								</span>
							</div>
							{bill && onOpenBill ? (
								<Button
									type="button"
									variant="secondary"
									className="self-start"
									onClick={() => {
										// `modal.hide()` без `resolveHide` не завершается — переходим до закрытия.
										onOpenBill(bill.id);
										void closeModal();
									}}
								>
									<ReceiptText className="size-4" aria-hidden="true" />
									{t("openBill")}
								</Button>
							) : null}
							<div className="grid grid-cols-2 gap-2">
								<ReadOnlyTile label={t("directionLabel")}>
									{debt.direction === "owed_to_me" ? `+ ${tDebt("directionOwedToMe")}` : `− ${tDebt("directionIOwe")}`}
								</ReadOnlyTile>
								<ReadOnlyTile label={t("amountLabel")}>{formatMoney(debt.principalAmount, debt.currency)}</ReadOnlyTile>
							</div>
						</>
					) : (
						<>
							<DirectionToggle value={direction} onChange={setDirection} label={t("directionLabel")} surface="sheet" />
							<div className="flex flex-col gap-1.5">
								<AmountField
									id={amountId}
									label={t("amountLabel")}
									value={amount}
									onValueChange={(raw) => {
										setAmount(raw);
										if (errors.amount) setErrors({});
									}}
									currency={currency}
									onCurrencyChange={setCurrency}
									currencyTitle={t("currencyTitle")}
									currencyLabel={(name) => t("currencyLabel", { name })}
									invalid={Boolean(errors.amount)}
									describedBy={errors.amount ? amountErrorId : undefined}
									surface="sheet"
								/>
								{errors.amount ? <FieldError id={amountErrorId}>{errors.amount}</FieldError> : null}
							</div>
						</>
					)}

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
							className="min-h-13 rounded-[16px] px-4"
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

export function showEditDebtDialog(props: Props) {
	return NiceModal.show(EditDebtDialogComponent, props);
}
