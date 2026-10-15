import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
	type Bill,
	BillRow,
	ContactRowList,
	computeBillMyTotals,
	computeBillStatus,
	computeBillTransfers,
	useDebtStore,
} from "@/entities/debt";
import { cn } from "@/shared/lib/utils";
import { HOME_SCREEN_NS } from "../translations";

type BillItem = { bill: Bill; closed: boolean; totals: { owedToMe: number; iOwe: number } };

/** Секция «Счета N»: активные от новых к старым, ниже — свёрнутая группа «Закрытые N». Без счетов не показывается. */
export function BillsSection() {
	const { t } = useTranslation(HOME_SCREEN_NS);
	const billsById = useDebtStore((s) => s.billsById);
	const debtsById = useDebtStore((s) => s.debtsById);
	const [closedOpen, setClosedOpen] = useState(false);

	const { active, closed } = useMemo(() => {
		const debts = Object.values(debtsById);
		const items: BillItem[] = Object.values(billsById)
			.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
			.map((bill) => ({
				bill,
				closed:
					computeBillStatus(
						bill,
						debts.filter((d) => d.billId === bill.id),
					).status === "closed",
				totals: computeBillMyTotals(computeBillTransfers(bill) ?? []),
			}));
		return { active: items.filter((i) => !i.closed), closed: items.filter((i) => i.closed) };
	}, [billsById, debtsById]);

	if (active.length + closed.length === 0) return null;

	const renderRows = (items: BillItem[]) => (
		<ContactRowList>
			{items.map(({ bill, closed: isClosed, totals }) => (
				<li key={bill.id}>
					<BillRow bill={bill} totals={totals} currency={bill.currency} closed={isClosed} />
				</li>
			))}
		</ContactRowList>
	);

	return (
		<section aria-labelledby="home-bills" className="mt-4 flex flex-col gap-3 lg:mt-6">
			<h2 id="home-bills" className="text-heading px-1 lg:text-[20px] lg:leading-7">
				{t("bills")} <span className="text-muted-foreground font-medium">{active.length}</span>
			</h2>
			{active.length > 0 ? renderRows(active) : null}
			{closed.length > 0 ? (
				<Collapsible open={closedOpen} onOpenChange={setClosedOpen} className="flex flex-col gap-2">
					<CollapsibleTrigger className="text-muted-foreground hover:text-foreground flex min-h-11 items-center gap-1.5 self-start rounded-full px-2 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring">
						{t("billsClosed")} <span>{closed.length}</span>
						<ChevronDown className={cn("size-4 transition-transform", closedOpen && "rotate-180")} aria-hidden="true" />
					</CollapsibleTrigger>
					<CollapsibleContent>{renderRows(closed)}</CollapsibleContent>
				</Collapsible>
			) : null}
		</section>
	);
}
