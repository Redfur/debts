import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { type Contact, ContactAvatar, computeContactSummary, computeDebtBalance, useDebtStore } from "@/entities/debt";
import { showAddRepaymentDialog } from "@/features/add-repayment";
import { showCreateDebtDialog } from "@/features/create-debt";
import { CURRENCY_SYMBOL, type SUPPORTED_CURRENCIES } from "@/shared/config/currencies";
import { COMMON_NS } from "@/shared/i18n";
import { PageHeader, PageHeaderBackLink, ScreenBody } from "@/shared/layout";
import { formatAmount } from "@/shared/lib/format-amount";
import { showConfirmActionModal } from "@/shared/ui/modals";
import { CONTACT_DETAIL_NS } from "../translations";

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
	const debtsById = useDebtStore((s) => s.debtsById);
	const operationsByDebtId = useDebtStore((s) => s.operationsByDebtId);
	const deleteDebt = useDebtStore((s) => s.deleteDebt);

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
				leading={<PageHeaderBackLink to="/" ariaLabel={t("backToHome")} />}
				media={<ContactAvatar contact={contact} />}
				title={contact.name}
				actions={
					<Button type="button" size="sm" onClick={() => void showCreateDebtDialog({ initialContactId: contact.id })}>
						<Plus />
						{t("addDebtAction")}
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
						{debts.map((debt) => {
							const operations = operationsByDebtId[debt.id] ?? [];
							const balance = computeDebtBalance(debt, operations);
							const progress =
								debt.principalAmount > 0 ? ((debt.principalAmount - balance) / debt.principalAmount) * 100 : 0;
							const directionLabel = debt.direction === "owed_to_me" ? t("owedToMeTitle") : t("owedByMeTitle");

							return (
								<Card key={debt.id}>
									<CardContent className="flex flex-col gap-3 py-4">
										<div className="flex items-start justify-between gap-2">
											<div className="min-w-0">
												<p className="text-sm font-medium">
													{directionLabel} · {formatAmount(debt.principalAmount)} {CURRENCY_SYMBOL[debt.currency]}
												</p>
												{debt.note ? <p className="text-muted-foreground text-xs">{debt.note}</p> : null}
											</div>
											{debt.status === "closed" ? (
												<span className="text-muted-foreground text-xs">{t("statusClosed")}</span>
											) : (
												<Button type="button" variant="ghost" size="icon" onClick={() => handleDelete(debt.id)}>
													<Trash2 className="size-4" />
												</Button>
											)}
										</div>

										{debt.status === "active" ? (
											<>
												<Progress value={progress} />
												<div className="flex items-center justify-between gap-2">
													<p className="text-muted-foreground text-xs">
														{t("balanceLine", {
															amount: `${formatAmount(balance)} ${CURRENCY_SYMBOL[debt.currency]}`,
															principal: `${formatAmount(debt.principalAmount)} ${CURRENCY_SYMBOL[debt.currency]}`,
														})}
													</p>
													<Button
														type="button"
														size="sm"
														variant="outline"
														onClick={() => void showAddRepaymentDialog({ debtId: debt.id })}
													>
														{t("repayAction")}
													</Button>
												</div>
											</>
										) : null}

										<div className="flex flex-col gap-1 border-t pt-2">
											<p className="text-muted-foreground text-xs font-medium">{t("historyTitle")}</p>
											{operations.map((op) => (
												<div key={op.id} className="flex items-center justify-between text-xs">
													<span className="text-muted-foreground">
														{op.kind === "initial" ? t("operationInitial") : t("operationRepayment")}
														{" · "}
														{format(new Date(op.createdAt), "d MMM yyyy", { locale: ru })}
													</span>
													<span>
														{formatAmount(op.amount)} {CURRENCY_SYMBOL[debt.currency]}
													</span>
												</div>
											))}
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>
				)}
			</div>
		</ScreenBody>
	);
}
