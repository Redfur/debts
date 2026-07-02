import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { type FormEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { computeDebtBalance, useDebtStore } from "@/entities/debt";
import { CURRENCY_SYMBOL } from "@/shared/config/currencies";
import { COMMON_NS } from "@/shared/i18n";
import { useAddRepayment } from "../model/use-add-repayment";
import { ADD_REPAYMENT_NS } from "../translations";

type Props = {
	debtId: string;
};

const AddRepaymentDialogComponent = NiceModal.create(({ debtId }: Props) => {
	const { t } = useTranslation(ADD_REPAYMENT_NS);
	const { t: tCommon } = useTranslation(COMMON_NS);
	const modal = useModal();
	const { submit, pending } = useAddRepayment();

	const debt = useDebtStore((s) => s.debtsById[debtId]);
	const operations = useDebtStore((s) => s.operationsByDebtId[debtId] ?? []);
	const balance = debt ? computeDebtBalance(debt, operations) : 0;

	const [amount, setAmount] = useState("");
	const [note, setNote] = useState("");
	const [error, setError] = useState<string | null>(null);

	// NiceModal может держать компонент смонтированным между показами — сбрасываем форму при открытии.
	useEffect(() => {
		if (!modal.visible) return;
		setAmount("");
		setNote("");
		setError(null);
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

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		const parsedAmount = Number(amount.replace(",", "."));
		if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
			setError(t("errorAmountInvalid"));
			return;
		}
		if (parsedAmount > balance) {
			setError(t("errorExceedsBalance"));
			return;
		}
		setError(null);
		const ok = await submit(debtId, parsedAmount, note.trim() || undefined);
		if (ok) {
			await closeModal();
		} else {
			setError(t("errorGeneric"));
		}
	};

	return (
		<Dialog open={modal.visible} onOpenChange={handleOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("title")}</DialogTitle>
				</DialogHeader>
				<form className="flex flex-col gap-4" onSubmit={(e) => void handleSubmit(e)}>
					<p className="text-muted-foreground text-sm">
						{t("balanceLine", { amount: balance, symbol: CURRENCY_SYMBOL[debt.currency] })}
					</p>

					<div className="flex flex-col gap-1.5">
						<Label htmlFor="repayment-amount">{t("amountLabel")}</Label>
						<Input
							id="repayment-amount"
							inputMode="decimal"
							placeholder="0"
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<Label htmlFor="repayment-note">{t("noteLabel")}</Label>
						<Textarea id="repayment-note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
					</div>

					{error ? <p className="text-destructive text-sm">{error}</p> : null}

					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => void closeModal()}>
							{tCommon("cancel")}
						</Button>
						<Button type="submit" disabled={pending}>
							{tCommon("save")}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
});

export function showAddRepaymentDialog(props: Props) {
	return NiceModal.show(AddRepaymentDialogComponent, props);
}
