import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { type Debt, type DebtOperation, DebtStatusBadge, ENTITY_DEBT_NS } from "@/entities/debt";
import { showEditDebtDialog } from "@/features/edit-debt";
import { COMMON_NS } from "@/shared/i18n";
import { formatMoney } from "@/shared/lib/format-amount";
import { formatShortDate } from "@/shared/lib/format-date";
import { CONTACT_DETAIL_NS } from "../translations";
import { DebtHistory } from "./DebtHistory";

type Props = {
	debt: Debt;
	operations: DebtOperation[];
	onDelete: (debt: Debt) => void;
};

/** Компактная строка погашенного долга; по нажатию раскрывается история и «Изменить» / «Удалить». */
export function ClosedDebtRow({ debt, operations, onDelete }: Props) {
	const { t } = useTranslation(CONTACT_DETAIL_NS);
	const { t: tDebt } = useTranslation(ENTITY_DEBT_NS);
	const { t: tCommon } = useTranslation(COMMON_NS);
	const owedToMe = debt.direction === "owed_to_me";
	const summary = [
		`${owedToMe ? "+" : "−"}${formatMoney(debt.principalAmount, debt.currency)}`,
		tDebt(owedToMe ? "directionOwedToMeLower" : "directionIOweLower"),
		formatShortDate(debt.createdAt),
	].join(" · ");

	return (
		<Collapsible asChild>
			<article className="bg-card shadow-card flex flex-col rounded-card">
				<CollapsibleTrigger className="group flex items-center justify-between gap-2 rounded-card px-4 py-3.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring">
					<span className="flex min-w-0 flex-col gap-0.5">
						<span className="text-body font-medium break-words">{debt.note || t("untitledDebt")}</span>
						<span className="text-caption text-muted-foreground">{summary}</span>
					</span>
					<span className="flex shrink-0 items-center gap-1.5">
						<DebtStatusBadge />
						<ChevronDown
							className="text-muted-foreground size-4 transition-transform group-data-[state=open]:rotate-180"
							aria-hidden="true"
						/>
					</span>
				</CollapsibleTrigger>
				<CollapsibleContent className="flex flex-col gap-3 px-4 pb-4">
					<div className="flex gap-1.5">
						<Button
							type="button"
							variant="secondary"
							className="bg-background flex-1 font-normal"
							onClick={() => void showEditDebtDialog({ debtId: debt.id })}
						>
							{tCommon("edit")}
						</Button>
						<Button
							type="button"
							variant="secondary"
							className="bg-i-owe-muted text-i-owe-strong hover:bg-i-owe-muted/80 flex-1 font-normal"
							onClick={() => onDelete(debt)}
						>
							{tCommon("delete")}
						</Button>
					</div>
					<DebtHistory debt={debt} operations={operations} defaultOpen />
				</CollapsibleContent>
			</article>
		</Collapsible>
	);
}
