import { Plus } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Contact, ContactAvatar, computeContactSummary, useDebtStore } from "@/entities/debt";
import { CURRENCY_SYMBOL, type SUPPORTED_CURRENCIES } from "@/shared/config/currencies";
import { COMMON_NS } from "@/shared/i18n";
import { PageHeader, PageHeaderBackLink, ScreenBody } from "@/shared/layout";
import { formatAmount } from "@/shared/lib/format-amount";
import { showConfirmActionModal } from "@/shared/ui/modals";
import { CONTACT_DETAIL_NS } from "../translations";
import { DebtCard } from "./DebtCard";

type Props = {
	contact: Contact;
};

function formatBreakdown(byCurrency: Partial<Record<(typeof SUPPORTED_CURRENCIES)[number], number>>): string {
	const entries = Object.entries(byCurrency) as [(typeof SUPPORTED_CURRENCIES)[number], number][];
	if (entries.length === 0) return "—";
	return entries.map(([code, amount]) => `${formatAmount(amount)} ${CURRENCY_SYMBOL[code]}`).join(" + ");
}

export function ContactDetailScreen({ contact }: Props) {
	const { t } = useTranslation(CONTACT_DETAIL_NS);
	const { t: tCommon } = useTranslation(COMMON_NS);
	const location = useLocation();
	const debtsById = useDebtStore((s) => s.debtsById);
	const operationsByDebtId = useDebtStore((s) => s.operationsByDebtId);
	const deleteDebt = useDebtStore((s) => s.deleteDebt);

	// Открыта либо с главной (контакт с активным долгом), либо со страницы «Контакты» — см. use-active-nav-section.
	const backTo = (location.state as { from?: "home" | "contacts" } | null)?.from === "home" ? "/" : "/contacts";

	const summary = computeContactSummary(contact.id, debtsById, operationsByDebtId);

	const debts = useMemo(
		() =>
			Object.values(debtsById)
				.filter((d) => d.contactId === contact.id)
				.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
		[debtsById, contact.id],
	);

	const handleDelete = (debtId: string) => {
		void showConfirmActionModal({
			title: t("deleteDebtConfirmTitle"),
			body: t("deleteDebtConfirmBody"),
			confirmLabel: tCommon("delete"),
			cancelLabel: tCommon("cancel"),
			confirmVariant: "destructive",
			onConfirm: () => void deleteDebt(debtId),
		});
	};

	return (
		<ScreenBody gap="comfortable">
			<PageHeader
				leading={<PageHeaderBackLink to={backTo} ariaLabel={tCommon("back")} />}
				media={<ContactAvatar contact={contact} />}
				title={contact.name}
				actions={
					<Button type="button" size="sm" asChild>
						<Link to={`/new?contactId=${contact.id}`}>
							<Plus />
							{t("addDebtAction")}
						</Link>
					</Button>
				}
			/>

			<div className="grid gap-3 sm:grid-cols-2">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">{t("owedToMeTitle")}</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-xl font-semibold">{formatBreakdown(summary.owedToMeByCurrency)}</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">{t("owedByMeTitle")}</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-xl font-semibold">{formatBreakdown(summary.owedByMeByCurrency)}</p>
					</CardContent>
				</Card>
			</div>

			<div className="flex flex-col gap-3">
				<h2 className="text-muted-foreground text-sm font-medium">{t("debtsSectionTitle")}</h2>
				{debts.length === 0 ? (
					<p className="text-muted-foreground text-sm">{t("emptyDebts")}</p>
				) : (
					<div className="flex flex-col gap-3">
						{debts.map((debt) => (
							<DebtCard
								key={debt.id}
								debt={debt}
								operations={operationsByDebtId[debt.id] ?? []}
								onDelete={handleDelete}
							/>
						))}
					</div>
				)}
			</div>
		</ScreenBody>
	);
}
