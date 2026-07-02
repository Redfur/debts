import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { ContactListItem, useDebtStore } from "@/entities/debt";
import { PageHeader, ScreenBody } from "@/shared/layout";
import { CONTACTS_SCREEN_NS } from "../translations";

export function ContactsScreen() {
	const { t } = useTranslation(CONTACTS_SCREEN_NS);
	const hydrated = useDebtStore((s) => s.hydrated);
	const contactsById = useDebtStore((s) => s.contactsById);

	const contacts = useMemo(
		() =>
			Object.values(contactsById)
				.filter((c) => !c.archivedAt)
				.sort((a, b) => a.name.localeCompare(b.name, "ru")),
		[contactsById],
	);

	if (!hydrated) {
		return (
			<ScreenBody variant="skeleton">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-16 w-full rounded-lg" />
				<Skeleton className="h-16 w-full rounded-lg" />
			</ScreenBody>
		);
	}

	return (
		<ScreenBody gap="comfortable">
			<PageHeader title={t("title")} />
			{contacts.length === 0 ? (
				<p className="text-muted-foreground text-sm">{t("empty")}</p>
			) : (
				<div className="flex flex-col gap-2">
					{contacts.map((c) => (
						<ContactListItem key={c.id} contact={c} linkState="contacts" />
					))}
				</div>
			)}
		</ScreenBody>
	);
}
