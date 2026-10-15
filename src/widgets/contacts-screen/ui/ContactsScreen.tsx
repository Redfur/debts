import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { ContactRow, ContactRowList, useDebtStore } from "@/entities/debt";
import { PageHeader, ScreenBody } from "@/shared/layout";
import { SearchField } from "@/shared/ui/search-field";
import { CONTACTS_SCREEN_NS } from "../translations";

type Props = {
	/** Выбранный контакт (раскладка «список + карточка» на десктопе). */
	selectedId?: string;
};

export function ContactsScreen({ selectedId }: Props) {
	const { t } = useTranslation(CONTACTS_SCREEN_NS);
	const hydrated = useDebtStore((s) => s.hydrated);
	const contactsById = useDebtStore((s) => s.contactsById);
	const [query, setQuery] = useState("");

	const contacts = useMemo(
		() =>
			Object.values(contactsById)
				.filter((c) => !c.archivedAt)
				.sort((a, b) => a.name.localeCompare(b.name, "ru")),
		[contactsById],
	);
	const trimmed = query.trim().toLowerCase();
	const visible = trimmed ? contacts.filter((c) => c.name.toLowerCase().includes(trimmed)) : contacts;

	if (!hydrated) return <ContactsSkeleton />;

	return (
		<ScreenBody>
			<PageHeader title={t("title")} titleAside={contacts.length > 0 ? contacts.length : undefined} />
			{contacts.length === 0 ? (
				<p className="text-muted-foreground text-body-s py-6 text-center">{t("empty")}</p>
			) : (
				<>
					<SearchField
						value={query}
						onValueChange={setQuery}
						label={t("searchLabel")}
						placeholder={t("searchPlaceholder")}
						clearLabel={t("clearSearch")}
					/>
					{visible.length === 0 ? (
						<p className="text-muted-foreground text-body-s py-6 text-center">
							{t("notFound", { query: query.trim() })}
						</p>
					) : (
						<ContactRowList className="mt-1">
							{visible.map((c) => (
								<li key={c.id}>
									<ContactRow contact={c} linkState="contacts" selected={c.id === selectedId} />
								</li>
							))}
						</ContactRowList>
					)}
				</>
			)}
		</ScreenBody>
	);
}

function ContactsSkeleton() {
	const { t } = useTranslation(CONTACTS_SCREEN_NS);
	return (
		<ScreenBody variant="skeleton">
			<PageHeader title={t("title")} />
			<span className="sr-only">{t("loading")}</span>
			<Skeleton className="bg-card shadow-card h-12 rounded-[16px]" />
			<div className="bg-card shadow-card mt-1 flex flex-col rounded-card py-1">
				{[140, 100, 120, 90, 160, 110].map((w, i) => (
					<div key={w} className="flex items-center gap-3 px-4 py-[11px]">
						<Skeleton className="size-[42px] rounded-full" />
						<Skeleton className="h-3.5 rounded-full" style={{ width: w }} />
						{i % 2 === 0 ? <Skeleton className="ml-auto h-[22px] w-[72px] rounded-chip" /> : null}
					</div>
				))}
			</div>
		</ScreenBody>
	);
}
