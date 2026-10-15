import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useDebtStore } from "@/entities/debt";
import { cn } from "@/shared/lib/utils";
import { TOGGLE_BILL_CLOSED_NS } from "../translations";

type Props = {
	billId: string;
	closed: boolean;
	className?: string;
};

/** «Закрыть счёт» / «Открыть счёт» — только для счёта без моих переводов (ручное закрытие). */
export function ToggleBillClosedButton({ billId, closed, className }: Props) {
	const { t } = useTranslation(TOGGLE_BILL_CLOSED_NS);
	const setBillManualClosed = useDebtStore((s) => s.setBillManualClosed);
	const [pending, setPending] = useState(false);

	return (
		<Button
			type="button"
			variant={closed ? "accent" : "default"}
			size="lg"
			className={cn("w-full", className)}
			disabled={pending}
			onClick={async () => {
				setPending(true);
				try {
					await setBillManualClosed(billId, !closed);
				} finally {
					setPending(false);
				}
			}}
		>
			{t(closed ? "reopen" : "close")}
		</Button>
	);
}
