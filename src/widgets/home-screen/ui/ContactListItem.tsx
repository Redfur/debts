import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { type Contact, ContactAvatar, computeContactSummary, useDebtStore } from "@/entities/debt";
import { CURRENCY_SYMBOL, type SUPPORTED_CURRENCIES } from "@/shared/config/currencies";
import { formatAmount } from "@/shared/lib/format-amount";
import { HOME_SCREEN_NS } from "../translations";

type Props = {
	contact: Contact;
};

function formatBreakdown(byCurrency: Partial<Record<(typeof SUPPORTED_CURRENCIES)[number], number>>): string | null {
	const entries = Object.entries(byCurrency) as [(typeof SUPPORTED_CURRENCIES)[number], number][];
	if (entries.length === 0) return null;
	return entries.map(([code, amount]) => `${formatAmount(amount)} ${CURRENCY_SYMBOL[code]}`).join(" + ");
}

export function ContactListItem({ contact }: Props) {
	const { t } = useTranslation(HOME_SCREEN_NS);
	const debtsById = useDebtStore((s) => s.debtsById);
	const operationsByDebtId = useDebtStore((s) => s.operationsByDebtId);
	const summary = computeContactSummary(contact.id, debtsById, operationsByDebtId);

	const owedToMe = formatBreakdown(summary.owedToMeByCurrency);
	const owedByMe = formatBreakdown(summary.owedByMeByCurrency);

	return (
		<Link to={`/contacts/${contact.id}`}>
			<Card className="hover:bg-accent/50 transition-colors">
				<CardContent className="flex items-center gap-3 py-3">
					<ContactAvatar contact={contact} />
					<div className="min-w-0 flex-1">
						<p className="truncate text-sm font-medium">{contact.name}</p>
						{owedToMe ? (
							<p className="text-muted-foreground text-xs">{t("owedToMeLine", { amount: owedToMe })}</p>
						) : null}
						{owedByMe ? (
							<p className="text-muted-foreground text-xs">{t("owedByMeLine", { amount: owedByMe })}</p>
						) : null}
						{!owedToMe && !owedByMe ? <p className="text-muted-foreground text-xs">—</p> : null}
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}
