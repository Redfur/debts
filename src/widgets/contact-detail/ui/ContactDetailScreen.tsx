import { Plus } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { type Contact, ContactAvatar, computeContactTotals, type Debt, useDebtStore } from "@/entities/debt";
import { showDeleteBillConfirm } from "@/features/delete-bill";
import { COMMON_NS } from "@/shared/i18n";
import { PageHeader, PageHeaderBackLink, ScreenBody } from "@/shared/layout";
import { useDisplayCurrency } from "@/shared/lib/currency-preference";
import { formatMoney } from "@/shared/lib/format-amount";
import { cn } from "@/shared/lib/utils";
import { showConfirmActionModal } from "@/shared/ui/modals";
import { CONTACT_DETAIL_NS } from "../translations";
import { ClosedDebtRow } from "./ClosedDebtRow";
import { ContactSummary } from "./ContactSummary";
import { DebtCard } from "./DebtCard";

type Props = {
	contact: Contact;
};

export function ContactDetailScreen({ contact }: Props) {
	const { t } = useTranslation(CONTACT_DETAIL_NS);
	const { t: tCommon } = useTranslation(COMMON_NS);
	const location = useLocation();
	const debtsById = useDebtStore((s) => s.debtsById);
	const operationsByDebtId = useDebtStore((s) => s.operationsByDebtId);
	const ratesCache = useDebtStore((s) => s.ratesCache);
	const deleteDebt = useDebtStore((s) => s.deleteDebt);
	const billsById = useDebtStore((s) => s.billsById);
	const displayCurrency = useDisplayCurrency();

	// «Назад» — туда, откуда открыли (главная или «Контакты»); по прямой ссылке — в «Контакты».
	const backTo = (location.state as { from?: "home" | "contacts" } | null)?.from === "home" ? "/" : "/contacts";

	const totals = computeContactTotals(contact.id, debtsById, operationsByDebtId, ratesCache, displayCurrency);
	const { open, closed } = useMemo(() => {
		const all = Object.values(debtsById)
			.filter((d) => d.contactId === contact.id)
			.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
		return { open: all.filter((d) => d.status === "active"), closed: all.filter((d) => d.status === "closed") };
	}, [debtsById, contact.id]);

	const handleDelete = (debt: Debt) => {
		// Долг из счёта отдельно не удаляется — удаляется весь счёт.
		const bill = debt.billId ? billsById[debt.billId] : undefined;
		if (bill) {
			void showDeleteBillConfirm({ bill, fromDebt: true });
			return;
		}
		const amount = formatMoney(debt.principalAmount, debt.currency);
		void showConfirmActionModal({
			title: t("deleteDebtConfirmTitle"),
			body: debt.note
				? t("deleteDebtConfirmBodyNote", { note: debt.note, amount })
				: t("deleteDebtConfirmBody", { amount }),
			confirmLabel: tCommon("delete"),
			cancelLabel: tCommon("cancel"),
			confirmVariant: "destructive",
			onConfirm: () => void deleteDebt(debt.id),
		});
	};

	const addDebtHref = `/new?contactId=${contact.id}`;

	return (
		<ScreenBody>
			<PageHeader
				leading={<PageHeaderBackLink to={backTo} ariaLabel={tCommon("back")} />}
				leadingClassName="lg:hidden"
				media={<ContactAvatar contact={contact} size="lg" />}
				title={contact.name}
				actions={
					<Link to={addDebtHref} className={cn(buttonVariants({ variant: "accent" }), "hidden lg:inline-flex")}>
						<Plus className="size-5" strokeWidth={2.4} aria-hidden="true" />
						{t("addDebtAction")}
					</Link>
				}
			/>
			<Link to={addDebtHref} className={cn(buttonVariants({ variant: "accent", size: "lg" }), "lg:hidden")}>
				<Plus className="size-5" strokeWidth={2.4} aria-hidden="true" />
				{t("addDebtAction")}
			</Link>

			{open.length + closed.length === 0 ? (
				<p className="text-muted-foreground text-body-s py-8 text-center">{t("emptyDebts")}</p>
			) : (
				<>
					<ContactSummary totals={totals} displayCurrency={displayCurrency} />
					{open.length > 0 ? (
						<section className="flex flex-col gap-3">
							<h2 className="text-heading mx-1 mt-1.5 lg:text-[20px] lg:leading-7">
								{t("sectionOpen")} <span className="text-muted-foreground font-medium">{open.length}</span>
							</h2>
							{open.map((debt) => (
								<DebtCard
									key={debt.id}
									debt={debt}
									operations={operationsByDebtId[debt.id] ?? []}
									onDelete={handleDelete}
								/>
							))}
						</section>
					) : null}
					{closed.length > 0 ? (
						<section className="flex flex-col gap-3">
							<h2 className="text-heading mx-1 mt-2.5 lg:text-[20px] lg:leading-7">
								{t("sectionClosed")} <span className="text-muted-foreground font-medium">{closed.length}</span>
							</h2>
							{closed.map((debt) => (
								<ClosedDebtRow
									key={debt.id}
									debt={debt}
									operations={operationsByDebtId[debt.id] ?? []}
									onDelete={handleDelete}
								/>
							))}
						</section>
					) : null}
				</>
			)}
		</ScreenBody>
	);
}
