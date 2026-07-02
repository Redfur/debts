import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { AmountInput } from "@/components/ui/amount-input";
import { Button } from "@/components/ui/button";
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
	onSuccess: (debtId: string) => void;
	onCancel: () => void;
};

export function CreateDebtForm({ initialContactId, onSuccess, onCancel }: Props) {
	const { t } = useTranslation(CREATE_DEBT_NS);
	const { t: tCommon } = useTranslation(COMMON_NS);
	const { submit, pending } = useCreateDebt();

	const [contactId, setContactId] = useState<string | undefined>(initialContactId);
	const [direction, setDirection] = useState<DebtDirection>("owed_to_me");
	const [currency, setCurrency] = useState<CurrencyCode>("RUB");
	const [amount, setAmount] = useState("");
	const [note, setNote] = useState("");
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!contactId) {
			setError(t("errorContactRequired"));
			return;
		}
		const parsedAmount = Number(amount);
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
			onSuccess(debtId);
		} else {
			setError(t("errorGeneric"));
		}
	};

	return (
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
					<AmountInput id="debt-amount" placeholder="0" value={amount} onValueChange={setAmount} />
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

			<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
				<Button type="button" variant="outline" onClick={onCancel}>
					{tCommon("cancel")}
				</Button>
				<Button type="submit" disabled={pending}>
					{tCommon("create")}
				</Button>
			</div>
		</form>
	);
}
