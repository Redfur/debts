import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { type Debt, type DebtOperation, useDebtStore } from "@/entities/debt";
import { showContactSettlementDetails } from "@/features/view-contact-settlement";
import { formatMoney } from "@/shared/lib/format-amount";
import { formatShortDate } from "@/shared/lib/format-date";
import { useLocalizationPreferences } from "@/shared/lib/localization-preference";
import { cn } from "@/shared/lib/utils";
import { CONTACT_DETAIL_NS } from "../translations";

type Props = {
	debt: Debt;
	operations: DebtOperation[];
	defaultOpen?: boolean;
};

/** История операций долга под переключателем «История · N операций», новые сверху. */
export function DebtHistory({ debt, operations, defaultOpen }: Props) {
	useLocalizationPreferences();
	const { t } = useTranslation(CONTACT_DETAIL_NS);
	const ordered = [...operations].reverse();
	const bill = useDebtStore((s) => (debt.billId ? s.billsById[debt.billId] : undefined));
	const settlements = useDebtStore((s) => s.settlementsById);
	// У «Создание долга» из счёта вместо заметки — «из счёта «<описание>»».
	const billNote = bill ? t("fromBill", { title: bill.title ?? t("untitledBill") }) : null;

	return (
		<Collapsible defaultOpen={defaultOpen} className="border-border flex flex-col border-t">
			<CollapsibleTrigger className="group text-muted-foreground text-caption flex min-h-11 items-center justify-between rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
				{t("history", { count: operations.length })}
				<ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" aria-hidden="true" />
			</CollapsibleTrigger>
			<CollapsibleContent>
				<ol className="flex flex-col">
					{ordered.map((op) => {
						const repayment = op.kind === "repayment";
						const settlement = op.settlementId ? settlements[op.settlementId] : undefined;
						const fromSettlement = op.kind === "initial" ? settlement : undefined;
						const label = t(
							op.kind === "settlement_close"
								? "operationSettlement"
								: fromSettlement
									? "operationSettlementOrigin"
									: repayment
										? "operationRepayment"
										: "operationInitial",
						);
						return (
							<li key={op.id} className="flex items-start gap-2.5 py-1.5">
								<span
									aria-hidden="true"
									className={cn(
										"mt-1.5 size-2 shrink-0 rounded-full",
										repayment
											? debt.direction === "owed_to_me"
												? "bg-owed-to-me"
												: "bg-i-owe"
											: "border-muted-foreground border-2",
									)}
								/>
								<span className="flex min-w-0 flex-1 flex-col gap-px">
									{settlement ? (
										<button
											type="button"
											className="touch-target text-body-s w-fit text-left font-semibold underline"
											onClick={() => void showContactSettlementDetails(settlement.id)}
										>
											{label}
										</button>
									) : (
										<span className="text-body-s font-semibold">{label}</span>
									)}
									<span className="text-caption text-muted-foreground">
										{[formatShortDate(op.createdAt), repayment ? op.note : (billNote ?? op.note)]
											.filter(Boolean)
											.join(" · ")}
									</span>
								</span>
								<span className="text-body-s font-semibold whitespace-nowrap">
									{fromSettlement?.remainder
										? formatMoney(fromSettlement.remainder.cents / 100, fromSettlement.currency)
										: formatMoney(op.amount, debt.currency)}
								</span>
							</li>
						);
					})}
				</ol>
			</CollapsibleContent>
		</Collapsible>
	);
}
