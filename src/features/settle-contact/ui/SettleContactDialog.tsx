import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { ChevronDown } from "lucide-react";
import { type FormEvent, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SegmentedControl, SegmentedControlItem } from "@/components/ui/segmented-control";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
	computeSettlementBasis,
	computeSettlementRemainder,
	type Debt,
	type SettlementTransfer,
	useDebtStore,
} from "@/entities/debt";
import { COMMON_NS } from "@/shared/i18n";
import { formatMoney } from "@/shared/lib/format-amount";
import { useLocalizationPreferences } from "@/shared/lib/localization-preference";
import { useModalClose } from "@/shared/lib/use-modal-close";
import { AmountInput } from "@/shared/ui/amount-input";
import { FormAlert } from "@/shared/ui/form-message";
import { SETTLE_CONTACT_NS } from "../translations";

type Props = { contactId: string };
type Currency = Debt["currency"];
type Basis = ReturnType<typeof computeSettlementBasis>;

function Draft({
	contactId,
	currency,
	basis,
	pending,
	cancel,
	confirm,
}: {
	contactId: string;
	currency: Currency;
	basis: Basis;
	pending: boolean;
	cancel: () => void;
	confirm: (contactId: string, currency: Currency, basis: Basis, transfer: SettlementTransfer | null) => Promise<void>;
}) {
	const { t } = useTranslation(SETTLE_CONTACT_NS);
	const { t: common } = useTranslation(COMMON_NS);
	const amountId = useId();
	const [editing, setEditing] = useState(basis.netCents !== 0);
	const [direction, setDirection] = useState<SettlementTransfer["direction"] | "">(
		basis.netCents === 0 ? "" : basis.netCents < 0 ? "sent" : "received",
	);
	const [amount, setAmount] = useState(basis.netCents ? String(Math.abs(basis.netCents) / 100) : "");
	const cents = Math.round(Number(amount) * 100);
	const transfer = editing && direction && amount !== "" ? { direction, cents } : null;
	const required = editing && transfer === null;
	const remainder = required ? undefined : computeSettlementRemainder(basis, transfer);
	const money = (value: number) => formatMoney(value / 100, currency);
	const submit = (event: FormEvent) => {
		event.preventDefault();
		if (remainder !== undefined && !pending) void confirm(contactId, currency, basis, transfer);
	};

	return (
		<form className="flex min-h-0 flex-col gap-3" onSubmit={submit}>
			<div className="flex min-h-0 flex-col gap-3 overflow-y-auto overscroll-contain">
				<div className="bg-secondary text-body-s grid gap-1 rounded-control p-3">
					<span>
						{t("iOwe")}: {money(basis.iOweCents)}
					</span>
					<span>
						{t("owedToMe")}: {money(basis.owedToMeCents)}
					</span>
					<strong>
						{basis.netCents === 0
							? t("even")
							: t(basis.netCents < 0 ? "owing" : "due", { amount: money(Math.abs(basis.netCents)) })}
					</strong>
				</div>
				<Collapsible>
					<CollapsibleTrigger className="group touch-target flex min-h-11 w-full items-center justify-between text-sm">
						{t("closing", { count: basis.debts.length })}
						<ChevronDown className="size-4 group-data-[state=open]:rotate-180" aria-hidden="true" />
					</CollapsibleTrigger>
					<CollapsibleContent>
						<ul className="flex flex-col gap-2 text-sm">
							{basis.debts.map(({ debt, balanceCents }) => (
								<li key={debt.id} className="flex justify-between gap-2">
									<span className="min-w-0 break-words">{debt.note || t("untitled")}</span>
									<span className="shrink-0">
										{debt.direction === "i_owe" ? "−" : "+"}
										{money(balanceCents)}
									</span>
								</li>
							))}
						</ul>
					</CollapsibleContent>
				</Collapsible>
				{editing ? (
					<div className="flex flex-col gap-2">
						<SegmentedControl
							aria-label={t("direction")}
							value={direction}
							onValueChange={(value) => {
								if ((value === "sent" || value === "received") && direction !== value) {
									setDirection(value);
									if (direction) setAmount("");
								}
							}}
							disabled={pending}
						>
							<SegmentedControlItem value="sent">{t("sent")}</SegmentedControlItem>
							<SegmentedControlItem value="received">{t("received")}</SegmentedControlItem>
						</SegmentedControl>
						<label htmlFor={amountId} className="text-caption">
							{t("amount")} · {currency}
						</label>
						<AmountInput id={amountId} value={amount} onValueChange={setAmount} disabled={pending} placeholder="0" />
						{!required && remainder === undefined ? (
							<FormAlert>{t(cents === 0 ? "zeroError" : "amountError")}</FormAlert>
						) : null}
						{basis.netCents === 0 ? (
							<Button
								type="button"
								variant="ghost"
								onClick={() => {
									setEditing(false);
									setDirection("");
									setAmount("");
								}}
							>
								{t("noTransfer")}
							</Button>
						) : null}
					</div>
				) : (
					<div className="flex items-center justify-between gap-2">
						<span className="text-sm">{t("noTransfer")}</span>
						<Button type="button" variant="outline" onClick={() => setEditing(true)}>
							{t("enterTransfer")}
						</Button>
					</div>
				)}
				<div aria-live="polite" className="text-body-s font-semibold">
					{remainder === undefined
						? null
						: remainder === null
							? t("noRemainder", { currency })
							: t(remainder.direction === "i_owe" ? "oweRemainder" : "dueRemainder", {
									amount: money(remainder.cents),
								})}
				</div>
			</div>
			<div className="flex shrink-0 gap-2">
				<Button type="button" variant="secondary" className="flex-1" onClick={cancel} disabled={pending}>
					{common("cancel")}
				</Button>
				<Button type="submit" className="flex-[2]" disabled={pending || remainder === undefined}>
					{t("confirm")}
				</Button>
			</div>
		</form>
	);
}

const SettleContactDialog = NiceModal.create(({ contactId }: Props) => {
	const { t } = useTranslation(SETTLE_CONTACT_NS);
	const { t: common } = useTranslation(COMMON_NS);
	useLocalizationPreferences();
	const modal = useModal();
	const { close, onCloseComplete } = useModalClose(modal);
	const contact = useDebtStore((state) => state.contactsById[contactId]);
	const debts = useDebtStore((state) => state.debtsById);
	const operations = useDebtStore((state) => state.operationsByDebtId);
	const settle = useDebtStore((state) => state.settleContact);
	const [selection, setSelection] = useState<Currency>();
	const [revision, setRevision] = useState(0);
	const [message, setMessage] = useState<"changed" | "error">();
	const [pending, setPending] = useState(false);
	const busy = useRef(false);
	const currencies = [
		...new Set(
			Object.values(debts)
				.filter((debt) => debt.contactId === contactId && debt.status === "active")
				.map((debt) => debt.currency),
		),
	].sort();
	const currency =
		currencies.length === 1 ? currencies[0] : selection && currencies.includes(selection) ? selection : undefined;
	const basis = currency ? computeSettlementBasis(contactId, currency, Object.values(debts), operations) : undefined;
	const cancel = () => {
		if (!busy.current) void close();
	};
	const confirm = async (id: string, currency: Currency, basis: Basis, transfer: SettlementTransfer | null) => {
		if (busy.current) return;
		busy.current = true;
		setPending(true);
		setMessage(undefined);
		const result = await settle(id, currency, basis, transfer);
		if (result === "saved") {
			void close();
			return;
		}
		busy.current = false;
		setPending(false);
		setMessage(result);
		if (result === "changed") setRevision((value) => value + 1);
	};
	return (
		<Dialog
			open={modal.visible}
			onCloseComplete={onCloseComplete}
			dismissible={!pending}
			onOpenChange={(open) => {
				if (!open) cancel();
			}}
		>
			<DialogContent className="gap-3">
				<DialogHeader>
					<DialogTitle>{t("title")}</DialogTitle>
					<DialogDescription>{t("description", { name: contact?.name ?? "" })}</DialogDescription>
				</DialogHeader>
				{currencies.length > 1 ? (
					<Select
						value={currency ?? ""}
						onValueChange={(value) => setSelection(currencies.find((code) => code === value))}
						disabled={pending}
					>
						<SelectTrigger aria-label={t("currency")}>
							<SelectValue placeholder={t("chooseCurrency")} />
						</SelectTrigger>
						<SelectContent>
							{currencies.map((code) => (
								<SelectItem key={code} value={code}>
									{code}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				) : null}
				{message ? <FormAlert>{t(message)}</FormAlert> : null}
				{currency && basis?.debts.length ? (
					<Draft
						key={`${currency}:${revision}`}
						contactId={contactId}
						currency={currency}
						basis={basis}
						pending={pending}
						cancel={cancel}
						confirm={confirm}
					/>
				) : (
					<>
						{!currencies.length ? <p>{t("empty")}</p> : null}
						<Button type="button" variant="secondary" onClick={cancel} disabled={pending}>
							{common("cancel")}
						</Button>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
});

export function showSettleContactDialog(contactId: string) {
	return NiceModal.show(SettleContactDialog, { contactId });
}
