import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { CurrencyCode } from "@/shared/lib/storage";
import { cn } from "@/shared/lib/utils";
import { computeContactSummary } from "../model/compute-contact-summary";
import { useDebtStore } from "../model/debt-store";
import type { Contact } from "../model/types";
import { ENTITY_DEBT_NS } from "../translations";
import { AmountPill } from "./AmountPill";
import { ContactAvatar } from "./ContactAvatar";

type Props = {
	contact: Contact;
	/** Откуда открыта карточка — определяет кнопку «назад» на детальной странице. */
	linkState: "home" | "contacts";
	/** Выделить строку (выбранный контакт в раскладке «список + карточка»). */
	selected?: boolean;
	/** Подсветка совпадения в имени (поиск). */
	nameSlot?: ReactNode;
};

/** Строка контакта: аватар, имя и плашки активных остатков / «Всё погашено» / «Нет долгов». */
export function ContactRow({ contact, linkState, selected, nameSlot }: Props) {
	const { t } = useTranslation(ENTITY_DEBT_NS);
	const debtsById = useDebtStore((s) => s.debtsById);
	const operationsByDebtId = useDebtStore((s) => s.operationsByDebtId);
	const summary = computeContactSummary(contact.id, debtsById, operationsByDebtId);
	const owedToMe = Object.entries(summary.owedToMeByCurrency) as [CurrencyCode, number][];
	const owedByMe = Object.entries(summary.owedByMeByCurrency) as [CurrencyCode, number][];
	const hasAnyDebt = Object.values(debtsById).some((d) => d.contactId === contact.id);

	return (
		<Link
			to={`/contacts/${contact.id}`}
			state={{ from: linkState }}
			aria-current={selected ? "page" : undefined}
			className={cn(
				"flex min-h-16 items-center gap-3 px-4 py-2.5 text-foreground transition-colors outline-none hover:bg-secondary focus-visible:bg-secondary active:bg-secondary",
				selected && "bg-secondary",
			)}
		>
			<ContactAvatar contact={contact} />
			<span className="text-body min-w-0 flex-1 truncate font-medium">{nameSlot ?? contact.name}</span>
			{owedToMe.length + owedByMe.length > 0 ? (
				<span className="flex shrink-0 flex-col items-end gap-1">
					{owedToMe.map(([code, amount]) => (
						<AmountPill key={`in-${code}`} amount={amount} currency={code} direction="owed_to_me" />
					))}
					{owedByMe.map(([code, amount]) => (
						<AmountPill key={`out-${code}`} amount={amount} currency={code} direction="i_owe" />
					))}
				</span>
			) : (
				<span className="text-caption text-muted-foreground inline-flex shrink-0 items-center gap-1">
					{hasAnyDebt ? (
						<>
							<Check className="size-3.5" strokeWidth={2.6} aria-hidden="true" />
							{t("statusSettled")}
						</>
					) : (
						t("statusNoDebts")
					)}
				</span>
			)}
		</Link>
	);
}

/** Список строк контактов в карточке с разделителями от аватара. */
export function ContactRowList({ children, className }: { children: ReactNode; className?: string }) {
	return (
		<ul
			className={cn(
				"bg-card shadow-card flex flex-col overflow-hidden rounded-card py-1 [&>li+li]:border-t [&>li+li]:border-border [&>li+li]:[border-image:linear-gradient(to_right,transparent_70px,var(--border)_70px)_1]",
				className,
			)}
		>
			{children}
		</ul>
	);
}
