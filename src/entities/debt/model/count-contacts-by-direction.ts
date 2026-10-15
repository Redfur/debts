import { computeContactSummary } from "./compute-contact-summary";
import type { Contact, ContactDirectionFilter, Debt, DebtOperation } from "./types";

/** Подходит ли контакт под фильтр главной («Все» — есть хотя бы один активный долг). */
export function contactMatchesFilter(
	contactId: string,
	filter: ContactDirectionFilter,
	debtsById: Record<string, Debt>,
	operationsByDebtId: Record<string, DebtOperation[]>,
): boolean {
	const summary = computeContactSummary(contactId, debtsById, operationsByDebtId);
	const owedToMe = Object.keys(summary.owedToMeByCurrency).length > 0;
	const owedByMe = Object.keys(summary.owedByMeByCurrency).length > 0;
	if (filter === "owed-to-me") return owedToMe;
	if (filter === "i-owe") return owedByMe;
	return owedToMe || owedByMe;
}

/** Числа для вкладок фильтра: сколько контактов с активными долгами каждого направления. */
export function countContactsByDirection(
	contacts: Contact[],
	debtsById: Record<string, Debt>,
	operationsByDebtId: Record<string, DebtOperation[]>,
): Record<ContactDirectionFilter, number> {
	const counts: Record<ContactDirectionFilter, number> = { all: 0, "owed-to-me": 0, "i-owe": 0 };
	for (const contact of contacts) {
		for (const filter of ["all", "owed-to-me", "i-owe"] as const) {
			if (contactMatchesFilter(contact.id, filter, debtsById, operationsByDebtId)) counts[filter]++;
		}
	}
	return counts;
}
