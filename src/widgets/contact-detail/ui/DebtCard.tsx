import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
	BillLink,
	type BillLinkState,
	computeDebtBalance,
	type Debt,
	type DebtOperation,
	DirectionChip,
	useDebtStore,
} from "@/entities/debt";
import { showAddRepaymentDialog } from "@/features/add-repayment";
import { showEditDebtDialog } from "@/features/edit-debt";
import { COMMON_NS } from "@/shared/i18n";
import { formatMoney } from "@/shared/lib/format-amount";
import { formatShortDate } from "@/shared/lib/format-date";
import { cn } from "@/shared/lib/utils";
import { CONTACT_DETAIL_NS } from "../translations";
import { DebtHistory } from "./DebtHistory";

type Props = {
	debt: Debt;
	operations: DebtOperation[];
	onDelete: (debt: Debt) => void;
};

/** Карточка активного долга: метка направления и дата, заголовок-заметка, остаток с полосой, действия, история. */
export function DebtCard({ debt, operations, onDelete }: Props) {
	const { t } = useTranslation(CONTACT_DETAIL_NS);
	const { t: tCommon } = useTranslation(COMMON_NS);

	const balance = computeDebtBalance(debt, operations);
	const repaid = debt.principalAmount - balance;
	const percent = debt.principalAmount > 0 ? (repaid / debt.principalAmount) * 100 : 0;
	const owedToMe = debt.direction === "owed_to_me";
	const bill = useDebtStore((s) => (debt.billId ? s.billsById[debt.billId] : undefined));
	const navigate = useNavigate();
	const openBill = (billId: string) =>
		navigate(`/bills/${billId}`, { state: { from: "contact", contactId: debt.contactId } satisfies BillLinkState });

	return (
		<article className="bg-card shadow-card flex flex-col gap-3 rounded-card p-4">
			<div className="flex items-center justify-between gap-2">
				<DirectionChip direction={debt.direction} />
				<span className="text-caption text-muted-foreground">{formatShortDate(debt.createdAt)}</span>
			</div>
			<h3 className="text-heading break-words">{debt.note || t("untitledDebt")}</h3>
			{bill ? <BillLink bill={bill} state={{ from: "contact", contactId: debt.contactId }} /> : null}
			<div className="flex flex-col gap-2">
				<div className="flex items-baseline justify-between gap-2">
					<span className="text-caption text-muted-foreground">{t("balance")}</span>
					<span className="text-right">
						<b className="text-[20px] leading-[26px] font-bold whitespace-nowrap">
							{formatMoney(balance, debt.currency)}
						</b>
						<span className="text-caption text-muted-foreground">
							{" "}
							{t("ofPrincipal", { amount: formatMoney(debt.principalAmount, debt.currency) })}
						</span>
					</span>
				</div>
				<div
					role="img"
					aria-label={
						repaid > 0
							? t("progressA11y", {
									repaid: formatMoney(repaid, debt.currency),
									principal: formatMoney(debt.principalAmount, debt.currency),
								})
							: t("progressNoneA11y")
					}
					className="bg-border flex h-1.5 overflow-hidden rounded-full"
				>
					{percent > 0 ? (
						<span
							className={cn("rounded-full", owedToMe ? "bg-owed-to-me" : "bg-i-owe")}
							style={{ width: `${percent}%` }}
						/>
					) : null}
				</div>
			</div>
			<div className="flex gap-1.5">
				<Button
					type="button"
					className="flex-1 text-[15px]"
					onClick={() => void showAddRepaymentDialog({ debtId: debt.id })}
				>
					{t("repayAction")}
				</Button>
				<Button
					type="button"
					variant="secondary"
					className="bg-background px-3.5 font-normal"
					onClick={() => void showEditDebtDialog({ debtId: debt.id, onOpenBill: openBill })}
				>
					{tCommon("edit")}
				</Button>
				<Button
					type="button"
					variant="secondary"
					className="bg-i-owe-muted text-i-owe-strong hover:bg-i-owe-muted/80 px-3.5 font-normal"
					onClick={() => onDelete(debt)}
				>
					{tCommon("delete")}
				</Button>
			</div>
			<DebtHistory debt={debt} operations={operations} />
		</article>
	);
}
