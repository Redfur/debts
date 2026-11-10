import { useState } from "react";
import { createRoot } from "react-dom/client";
import { AmountPill, TransferList } from "@/entities/debt";
import "@/shared/i18n";
import { formatAmount, formatMoney } from "@/shared/lib/format-amount";
import {
	formatDateTimeWithYear,
	formatLongDate,
	formatMoment,
	formatReleaseDate,
	formatShortDate,
} from "@/shared/lib/format-date";
import { formatPeopleCount } from "@/shared/lib/format-people-count";
import { useLocalizationPreferences } from "@/shared/lib/localization-preference";
import { AmountInput } from "@/shared/ui/amount-input";
import { CurrencyBreakdown } from "@/shared/ui/money";
import "@/index.css";

function Fixture() {
	useLocalizationPreferences();
	const [value, setValue] = useState("1234.56");
	return (
		<main className="mx-auto flex max-w-xl flex-col gap-4 p-4">
			<label htmlFor="amount">Amount</label>
			<AmountInput id="amount" value={value} onValueChange={setValue} />
			<output id="raw">{value}</output>
			<output id="money">{formatMoney(1234.56, "RUB")}</output>
			<output id="percent">{formatAmount(12.5)} %</output>
			<AmountPill amount={1234.56} currency="RUB" direction="owed_to_me" />
			<CurrencyBreakdown byCurrency={{ RUB: 1234.56, USD: 12.5 }} />
			<TransferList transfers={[{ from: "me", to: "test", amount: 1234.56 }]} currency="RUB" />
			<output id="dates">
				{JSON.stringify([
					formatShortDate("2025-09-12", new Date(2026, 0, 1)),
					formatLongDate("2026-10-15"),
					formatMoment(new Date(2026, 9, 15, 12, 40)),
					formatDateTimeWithYear(new Date(2026, 9, 12, 18, 5)),
					formatReleaseDate("2026-11-07"),
				])}
			</output>
			<output id="people">{JSON.stringify([1, 2, 5, 11, 22].map(formatPeopleCount))}</output>
		</main>
	);
}

const root = document.getElementById("root");
if (root) createRoot(root).render(<Fixture />);
