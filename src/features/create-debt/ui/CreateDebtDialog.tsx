import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { type FormEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ContactCombobox } from "@/features/select-contact";
import { CURRENCY_SYMBOL, SUPPORTED_CURRENCIES } from "@/shared/config/currencies";
import { COMMON_NS } from "@/shared/i18n";
import type { CurrencyCode, DebtDirection } from "@/shared/lib/storage";
import { useCreateDebt } from "../model/use-create-debt";
import { CREATE_DEBT_NS } from "../translations";

type Props = {
	initialContactId?: string;
};

const CreateDebtDialogComponent = NiceModal.create(({ initialContactId }: Props) => {
	const { t } = useTranslation(CREATE_DEBT_NS);
	const { t: tCommon } = useTranslation(COMMON_NS);
	const modal = useModal();
	const { submit, pending } = useCreateDebt();

	const [contactId, setContactId] = useState<string | undefined>(initialContactId);
	const [direction, setDirection] = useState<DebtDirection>("owed_to_me");
	const [currency, setCurrency] = useState<CurrencyCode>("RUB");
	const [amount, setAmount] = useState("");
	const [note, setNote] = useState("");
	const [error, setError] = useState<string | null>(null);

	// NiceModal может держать компонент смонтированным между показами — сбрасываем форму при открытии.
	useEffect(() => {
		if (!modal.visible) return;
		setContactId(initialContactId);
		setDirection("owed_to_me");
		setCurrency("RUB");
		setAmount("");
		setNote("");
		setError(null);
	}, [modal.visible, initialContactId]);

	const closeModal = async () => {
		await modal.hide();
		modal.remove();
	};

	const handleOpenChange = (open: boolean) => {
		if (open) return;
		void closeModal();
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!contactId) {
			setError(t("errorContactRequired"));
			return;
		}
		const parsedAmount = Number(amount.replace(",", "."));
		if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
			setError(t("errorAmountInvalid"));
			return;
		}
		setError(null);
		const debtId = await submit({
			contactId,
			direction,
			currency,
			amount: parsedAmount,
			note: note.trim() || undefined,
		});
		if (debtId) {
			modal.resolve(debtId);
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
						<Label>{t("contactLabel")}</Label>
						<ContactCombobox value={contactId} onChange={setContactId} />
					</div>

					<div className="flex flex-col gap-1.5">
						<Label>{t("directionLabel")}</Label>
						<div className="flex gap-2">
							<Button
								type="button"
								className="flex-1"
								variant={direction === "owed_to_me" ? "default" : "outline"}
								onClick={() => setDirection("owed_to_me")}
							>
								{t("directionOwedToMe")}
							</Button>
							<Button
								type="button"
								className="flex-1"
								variant={direction === "i_owe" ? "default" : "outline"}
								onClick={() => setDirection("i_owe")}
							>
								{t("directionIOwe")}
							</Button>
						</div>
					</div>

					<div className="grid grid-cols-[1fr_auto] gap-2">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="debt-amount">{t("amountLabel")}</Label>
							<Input
								id="debt-amount"
								inputMode="decimal"
								placeholder="0"
								value={amount}
								onChange={(e) => setAmount(e.target.value)}
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="debt-currency">{t("currencyLabel")}</Label>
							<Select value={currency} onValueChange={(v) => setCurrency(v as CurrencyCode)}>
								<SelectTrigger id="debt-currency" className="w-24">
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

					<div className="flex flex-col gap-1.5">
						<Label htmlFor="debt-note">{t("noteLabel")}</Label>
						<Textarea id="debt-note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
					</div>

					{error ? <p className="text-destructive text-sm">{error}</p> : null}

					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => void closeModal()}>
							{tCommon("cancel")}
						</Button>
						<Button type="submit" disabled={pending}>
							{tCommon("create")}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
});

export function showCreateDebtDialog(props?: Props) {
	return NiceModal.show(CreateDebtDialogComponent, props ?? {});
}
