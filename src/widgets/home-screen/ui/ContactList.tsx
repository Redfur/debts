import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ContactListItem, computeContactSummary, useDebtStore } from "@/entities/debt";
import { HOME_SCREEN_NS } from "../translations";

function hasOutstandingDebt(summary: ReturnType<typeof computeContactSummary>): boolean {
	return Object.keys(summary.owedToMeByCurrency).length > 0 || Object.keys(summary.owedByMeByCurrency).length > 0;
}

/** Только контакты с непогашенным долгом (мне или я им) — полный список контактов см. на странице «Контакты». */
export function ContactList() {
	const { t } = useTranslation(HOME_SCREEN_NS);
	const contactsById = useDebtStore((s) => s.contactsById);
	const debtsById = useDebtStore((s) => s.debtsById);
	const operationsByDebtId = useDebtStore((s) => s.operationsByDebtId);

	const contacts = useMemo(
		() =>
			Object.values(contactsById)
				.filter((c) => !c.archivedAt && hasOutstandingDebt(computeContactSummary(c.id, debtsById, operationsByDebtId)))
				.sort((a, b) => a.name.localeCompare(b.name, "ru")),
		[contactsById, debtsById, operationsByDebtId],
	);

	if (contacts.length === 0) {
		return <p className="text-muted-foreground text-sm">{t("emptyContacts")}</p>;
	}

	return (
		<div className="flex flex-col gap-2">
			{contacts.map((c) => (
				<ContactListItem key={c.id} contact={c} linkState="home" />
			))}
		</div>
	);
}
