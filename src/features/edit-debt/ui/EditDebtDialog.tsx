import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { type FormEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AmountInput } from "@/components/ui/amount-input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useDebtOperations, useDebtStore } from "@/entities/debt";
import { CURRENCY_SYMBOL, SUPPORTED_CURRENCIES } from "@/shared/config/currencies";
import { COMMON_NS } from "@/shared/i18n";
import type { CurrencyCode, DebtDirection } from "@/shared/lib/storage";
import { useEditDebt } from "../model/use-edit-debt";
import { EDIT_DEBT_NS } from "../translations";

type Props = {
	debtId: string;
};

const EditDebtDialogComponent = NiceModal.create(({ debtId }: Props) => {
	const { t } = useTranslation(EDIT_DEBT_NS);
	const { t: tCommon } = useTranslation(COMMON_NS);
	const modal = useModal();
	const { submit, pending } = useEditDebt();

	const debt = useDebtStore((s) => s.debtsById[debtId]);
	const operations = useDebtOperations(debtId);
	const locked = operations.some((op) => op.kind === "repayment");

	const [direction, setDirection] = useState<DebtDirection>("owed_to_me");
	const [currency, setCurrency] = useState<CurrencyCode>("RUB");
	const [amount, setAmount] = useState("");
	const [note, setNote] = useState("");
	const [error, setError] = useState<string | null>(null);

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
		setError(null);
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
			if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
				setError(t("errorAmountInvalid"));
				return;
			}
			patch.amount = parsedAmount;
			patch.direction = direction;
			patch.currency = currency;
		}
		setError(null);
		const ok = await submit(debtId, patch);
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
					<div className="flex flex-col gap-1.5">
						<Label>{t("directionLabel")}</Label>
						<div className="flex gap-2">
							<Button
								type="button"
								className="flex-1"
								disabled={locked}
								variant={direction === "owed_to_me" ? "default" : "outline"}
								onClick={() => setDirection("owed_to_me")}
							>
								{t("directionOwedToMe")}
							</Button>
							<Button
								type="button"
								className="flex-1"
								disabled={locked}
								variant={direction === "i_owe" ? "default" : "outline"}
								onClick={() => setDirection("i_owe")}
							>
								{t("directionIOwe")}
							</Button>
						</div>
					</div>

					<div className="grid grid-cols-[1fr_auto] gap-2">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="edit-debt-amount">{t("amountLabel")}</Label>
							<AmountInput
								id="edit-debt-amount"
								placeholder="0"
								value={amount}
								onValueChange={setAmount}
								disabled={locked}
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="edit-debt-currency">{t("currencyLabel")}</Label>
							<Select value={currency} onValueChange={(v) => setCurrency(v as CurrencyCode)} disabled={locked}>
								<SelectTrigger id="edit-debt-currency" className="w-24">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{SUPPORTED_CURRENCIES.map((code) => (
										<SelectItem key={code} value={code}>
											{CURRENCY_SYMBOL[code]} {code}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					{locked ? <p className="text-muted-foreground text-xs">{t("lockedHint")}</p> : null}

					<div className="flex flex-col gap-1.5">
						<Label htmlFor="edit-debt-note">{t("noteLabel")}</Label>
						<Textarea id="edit-debt-note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
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

export function showEditDebtDialog(props: Props) {
	return NiceModal.show(EditDebtDialogComponent, props);
}
