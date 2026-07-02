import { useParams } from "react-router-dom";
import { useDebtStore } from "@/entities/debt";
import { ContactDetailScreen, ContactNotFound } from "@/widgets/contact-detail";

export function ContactDetailPage() {
	const { contactId } = useParams<{ contactId: string }>();
	const contact = useDebtStore((s) => (contactId ? s.contactsById[contactId] : undefined));

	if (!contact) {
		return <ContactNotFound />;
	}

	return <ContactDetailScreen contact={contact} />;
}
