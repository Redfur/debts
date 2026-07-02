import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { computeDebtBalance, type Debt, type DebtOperation } from "@/entities/debt";
import { showAddRepaymentDialog } from "@/features/add-repayment";
import { showEditDebtDialog } from "@/features/edit-debt";
import { CURRENCY_SYMBOL } from "@/shared/config/currencies";
import { COMMON_NS } from "@/shared/i18n";
import { formatAmount } from "@/shared/lib/format-amount";
import { CONTACT_DETAIL_NS } from "../translations";

type Props = {
	debt: Debt;
	operations: DebtOperation[];
	onDelete: (debtId: string) => void;
};

export function DebtCard({ debt, operations, onDelete }: Props) {
	const { t } = useTranslation(CONTACT_DETAIL_NS);
	const { t: tCommon } = useTranslation(COMMON_NS);

	const balance = computeDebtBalance(debt, operations);
	const progress = debt.principalAmount > 0 ? ((debt.principalAmount - balance) / debt.principalAmount) * 100 : 0;
	const directionLabel = debt.direction === "owed_to_me" ? t("owedToMeTitle") : t("owedByMeTitle");

	return (
		<Card>
			<CardContent className="flex flex-col gap-3 py-4">
				<div className="flex items-start justify-between gap-2">
					<div className="min-w-0">
						<p className="text-sm font-medium">
							{directionLabel} · {formatAmount(debt.principalAmount)} {CURRENCY_SYMBOL[debt.currency]}
						</p>
						{debt.note ? <p className="text-muted-foreground text-xs">{debt.note}</p> : null}
					</div>
					<div className="flex shrink-0 items-center gap-1">
						{debt.status === "closed" ? (
							<span className="text-muted-foreground text-xs">{t("statusClosed")}</span>
						) : null}
						<Button
							type="button"
							variant="ghost"
							size="icon"
							aria-label={tCommon("edit")}
							onClick={() => void showEditDebtDialog({ debtId: debt.id })}
						>
							<Pencil className="size-4" />
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							aria-label={tCommon("delete")}
							onClick={() => onDelete(debt.id)}
						>
							<Trash2 className="size-4" />
						</Button>
					</div>
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

				<Collapsible>
					<CollapsibleTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="h-auto w-fit justify-start px-0 text-muted-foreground text-xs font-medium hover:bg-transparent"
						>
							{t("historyShow", { count: operations.length })}
						</Button>
					</CollapsibleTrigger>
					<CollapsibleContent className="flex flex-col gap-2 border-t pt-2">
						{operations.map((op) => (
							<div key={op.id} className="flex flex-col gap-0.5">
								<div className="flex items-center justify-between text-xs">
									<span className="text-muted-foreground">
										{op.kind === "initial" ? t("operationInitial") : t("operationRepayment")}
										{" · "}
										{format(new Date(op.createdAt), "d MMM yyyy", { locale: ru })}
									</span>
									<span>
										{formatAmount(op.amount)} {CURRENCY_SYMBOL[debt.currency]}
									</span>
								</div>
								{op.note ? <p className="text-muted-foreground text-xs italic">{op.note}</p> : null}
							</div>
						))}
					</CollapsibleContent>
				</Collapsible>
			</CardContent>
		</Card>
	);
}
