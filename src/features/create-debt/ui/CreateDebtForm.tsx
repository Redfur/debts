import { type FormEvent, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DirectionToggle, useDebtStore } from "@/entities/debt";
import { ContactPicker } from "@/features/select-contact";
import { COMMON_NS } from "@/shared/i18n";
import type { CurrencyCode, DebtDirection } from "@/shared/lib/storage";
import { useKeyboardInset } from "@/shared/lib/use-keyboard-inset";
import { cn } from "@/shared/lib/utils";
import { AmountField } from "@/shared/ui/amount-field";
import { FieldError, FormAlert } from "@/shared/ui/form-message";
import { useCreateDebt } from "../model/use-create-debt";
import { CREATE_DEBT_NS } from "../translations";

type Props = {
	initialContactId?: string;
	onSuccess: (debtId: string) => void;
	onCancel: () => void;
};

type Errors = { contact?: string; amount?: string; form?: string };

/**
 * Экран нового долга на весь экран: шапка «Отмена» / «Новый долг», контакт, направление с подсказкой,
 * крупная сумма с валютой, заметка и «Создать», закреплённая над клавиатурой.
 */
export function CreateDebtForm({ initialContactId, onSuccess, onCancel }: Props) {
	const { t } = useTranslation(CREATE_DEBT_NS);
	const { t: tCommon } = useTranslation(COMMON_NS);
	const { submit, pending } = useCreateDebt();
	const contactsById = useDebtStore((s) => s.contactsById);
	const keyboardInset = useKeyboardInset();
	const amountId = useId();
	const amountErrorId = useId();
	const noteId = useId();

	const [contactId, setContactId] = useState<string | undefined>(initialContactId);
	const [picking, setPicking] = useState(false);
	const [direction, setDirection] = useState<DebtDirection>("owed_to_me");
	const [currency, setCurrency] = useState<CurrencyCode>("RUB");
	const [amount, setAmount] = useState("");
	const [note, setNote] = useState("");
	const [errors, setErrors] = useState<Errors>({});

	const contact = contactId ? contactsById[contactId] : undefined;

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		const parsedAmount = Number(amount);
		const next: Errors = {};
		if (!contact) next.contact = t("errorContactRequired");
		if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) next.amount = t("errorAmountInvalid");
		setErrors(next);
		if (!contact || next.amount) return;

		const debtId = await submit({
			contactId: contact.id,
			direction,
			currency,
			amount: parsedAmount,
			note: note.trim() || undefined,
		});
		if (debtId) onSuccess(debtId);
		else setErrors({ form: t("errorGeneric") });
	};

	return (
		<form noValidate className="mx-auto flex w-full max-w-xl flex-1 flex-col" onSubmit={(e) => void handleSubmit(e)}>
			<div className="flex flex-col gap-3.5 pt-[env(safe-area-inset-top,0px)] lg:pt-6">
				<header className="grid min-h-11 grid-cols-[1fr_auto_1fr] items-center pt-2">
					<button
						type="button"
						onClick={onCancel}
						className="text-body -ml-1 flex min-h-11 items-center justify-self-start rounded-md px-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						{tCommon("cancel")}
					</button>
					<h1 className="text-heading">{t("title")}</h1>
					<span />
				</header>

				<ContactPicker
					value={contact?.id}
					onChange={(id) => {
						setContactId(id);
						setErrors((prev) => ({ ...prev, contact: undefined }));
					}}
					onExpandedChange={setPicking}
					error={errors.contact}
				/>

				<div className={cn("flex flex-col gap-3.5", picking && "hidden")}>
					<div className="flex flex-col gap-1.5">
						<DirectionToggle value={direction} onChange={setDirection} label={t("directionLabel")} />
						{contact ? (
							<p
								className={cn(
									"text-caption pl-1 font-medium",
									direction === "owed_to_me" ? "text-owed-to-me-strong" : "text-i-owe-strong",
								)}
							>
								{t(direction === "owed_to_me" ? "hintOwedToMe" : "hintIOwe", { name: contact.name })}
							</p>
						) : null}
					</div>

					<div className="flex flex-col gap-1.5">
						<AmountField
							id={amountId}
							label={t("amountLabel")}
							value={amount}
							onValueChange={(raw) => {
								setAmount(raw);
								if (errors.amount) setErrors((prev) => ({ ...prev, amount: undefined }));
							}}
							currency={currency}
							onCurrencyChange={setCurrency}
							currencyTitle={t("currencyTitle")}
							currencyLabel={(name) => t("currencyLabel", { name })}
							invalid={Boolean(errors.amount)}
							describedBy={errors.amount ? amountErrorId : undefined}
						/>
						{errors.amount ? <FieldError id={amountErrorId}>{errors.amount}</FieldError> : null}
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
							className="bg-card shadow-card min-h-13 rounded-control px-4"
						/>
					</div>
				</div>
			</div>

			{/* Над клавиатурой: Chrome сжимает layout (interactive-widget), iOS — отступ по visualViewport. */}
			<div
				className={cn(
					"bg-background sticky z-10 mt-auto -mx-4 flex flex-col gap-2.5 px-4 pt-2.5 pb-3 lg:static lg:mx-0 lg:mt-0 lg:px-0 lg:pt-6",
					picking && "hidden",
				)}
				style={{ bottom: keyboardInset }}
			>
				{errors.form ? <FormAlert>{errors.form}</FormAlert> : null}
				<Button type="submit" variant="accent" size="lg" className="w-full" disabled={pending}>
					{tCommon("create")}
				</Button>
			</div>
		</form>
	);
}
