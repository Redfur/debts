import { type FormEvent, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	CreationDraftStatus,
	type DebtCreationFields,
	DirectionToggle,
	ENTITY_DEBT_NS,
	saveCreationDraft,
	useCreationDraftStore,
	useDebtCurrencies,
	useDebtStore,
} from "@/entities/debt";
import { ContactPicker } from "@/features/select-contact";
import { COMMON_NS } from "@/shared/i18n";
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
	onDelete: () => void;
};

type Errors = { contact?: "errorContactRequired"; amount?: "errorAmountInvalid"; form?: "errorGeneric" };

/**
 * Экран нового долга на весь экран: шапка «Назад» / «Новый долг», контакт, направление с подсказкой,
 * крупная сумма с валютой, заметка и «Создать долг», закреплённая над клавиатурой.
 */
export function CreateDebtForm({ initialContactId, onSuccess, onCancel, onDelete }: Props) {
	const { top: topCurrencies } = useDebtCurrencies();
	const { t } = useTranslation(CREATE_DEBT_NS);
	const { t: tCommon } = useTranslation(COMMON_NS);
	const { t: tEntity } = useTranslation(ENTITY_DEBT_NS);
	const { submit, pending } = useCreateDebt();
	const contactsById = useDebtStore((s) => s.contactsById);
	const keyboardInset = useKeyboardInset();
	const draftLocked = useCreationDraftStore((s) => s.debt.locked);
	const amountId = useId();
	const amountErrorId = useId();
	const noteId = useId();

	const [fields, renderFields] = useState<DebtCreationFields>(() => {
		const saved = useCreationDraftStore.getState().debt.draft;
		return saved?.kind === "debt"
			? saved.payload
			: { contactId: initialContactId, direction: "owed_to_me", currency: "RUB", amount: "", note: "" };
	});
	const current = useRef(fields);
	const patch = (change: Partial<DebtCreationFields>) => {
		if (useCreationDraftStore.getState().debt.locked) return;
		const next = { ...current.current, ...change };
		if (JSON.stringify(next) === JSON.stringify(current.current)) return;
		current.current = next;
		saveCreationDraft("debt", next);
		renderFields(next);
	};
	const { contactId, direction, currency, amount, note } = fields;
	const setContactId = (contactId: string) => patch({ contactId });
	const [picking, setPicking] = useState(false);
	const [errors, setErrors] = useState<Errors>({});

	const contact = contactId ? contactsById[contactId] : undefined;

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (pending || useCreationDraftStore.getState().debt.locked) return;
		const parsedAmount = Number(amount);
		const next: Errors = {};
		if (!contact) next.contact = "errorContactRequired";
		if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) next.amount = "errorAmountInvalid";
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
		else setErrors({ form: "errorGeneric" });
	};

	return (
		<form noValidate className="mx-auto flex w-full max-w-xl flex-1 flex-col" onSubmit={(e) => void handleSubmit(e)}>
			<fieldset disabled={pending || draftLocked} className="contents">
				<div className="flex flex-col gap-3.5 pt-[env(safe-area-inset-top,0px)] lg:pt-6">
					<header className="grid min-h-11 grid-cols-[1fr_auto_1fr] items-center pt-2">
						<button
							type="button"
							onClick={onCancel}
							className="text-body -ml-1 flex min-h-11 items-center justify-self-start rounded-md px-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							{tCommon("back")}
						</button>
						<h1 className="text-heading">{t("title")}</h1>
						<span />
					</header>

					{contactId && !contact ? <FormAlert>{tEntity("draftMissingContact")}</FormAlert> : null}
					<ContactPicker
						value={contact?.id}
						onChange={(id) => {
							setContactId(id);
							setErrors((prev) => ({ ...prev, contact: undefined }));
						}}
						onExpandedChange={setPicking}
						error={errors.contact ? t(errors.contact) : undefined}
					/>

					<div className={cn("flex flex-col gap-3.5", picking && "hidden")}>
						<div className="flex flex-col gap-1.5">
							<DirectionToggle
								value={direction}
								onChange={(direction) => patch({ direction })}
								label={t("directionLabel")}
							/>
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
								topCurrencies={topCurrencies}
								id={amountId}
								label={t("amountLabel")}
								value={amount}
								onValueChange={(raw) => {
									patch({ amount: raw });
									if (errors.amount) setErrors((prev) => ({ ...prev, amount: undefined }));
								}}
								currency={currency}
								onCurrencyChange={(currency) => patch({ currency })}
								currencyTitle={t("currencyTitle")}
								currencyLabel={(name) => t("currencyLabel", { name })}
								invalid={Boolean(errors.amount)}
								describedBy={errors.amount ? amountErrorId : undefined}
							/>
							{errors.amount ? <FieldError id={amountErrorId}>{t(errors.amount)}</FieldError> : null}
						</div>

						<div className="flex flex-col gap-1.5">
							<label htmlFor={noteId} className="text-caption text-muted-foreground pl-1">
								{t("noteLabel")}
							</label>
							<Input
								id={noteId}
								value={note}
								onChange={(e) => patch({ note: e.target.value })}
								placeholder={t("notePlaceholder")}
								enterKeyHint="done"
								className="bg-card shadow-card min-h-13 rounded-control px-4"
							/>
						</div>
					</div>
				</div>

				<div className={cn("mt-auto pt-4 lg:mt-0 lg:pt-6", picking && "hidden")}>
					<CreationDraftStatus kind="debt" onDelete={onDelete} />
				</div>

				{/* Над клавиатурой: Chrome сжимает layout (interactive-widget), iOS — отступ по visualViewport. */}
				<div
					className={cn(
						"bg-background sticky z-10 -mx-4 flex flex-col gap-2.5 px-4 pt-2.5 pb-3 lg:static lg:mx-0 lg:px-0",
						picking && "hidden",
					)}
					style={{ bottom: keyboardInset }}
				>
					{errors.form ? <FormAlert>{t(errors.form)}</FormAlert> : null}
					<Button type="submit" variant="accent" size="lg" className="w-full" disabled={pending}>
						{t("createDebt")}
					</Button>
				</div>
			</fieldset>
		</form>
	);
}
