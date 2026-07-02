import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDebtStore } from "@/entities/debt";
import { HOME_SCREEN_NS } from "../translations";
import { ContactListItem } from "./ContactListItem";

export function ContactList() {
	const { t } = useTranslation(HOME_SCREEN_NS);
	const contactsById = useDebtStore((s) => s.contactsById);

	const contacts = useMemo(
		() =>
			Object.values(contactsById)
				.filter((c) => !c.archivedAt)
				.sort((a, b) => a.name.localeCompare(b.name, "ru")),
		[contactsById],
	);

	if (contacts.length === 0) {
		return <p className="text-muted-foreground text-sm">{t("emptyContacts")}</p>;
	}

	return (
		<div className="flex flex-col gap-2">
			{contacts.map((c) => (
				<ContactListItem key={c.id} contact={c} />
			))}
		</div>
	);
}
