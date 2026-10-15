import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/utils";
import { ME_REF } from "../model/bill/types";
import { useDebtStore } from "../model/debt-store";
import { ENTITY_DEBT_NS } from "../translations";
import { ContactAvatar } from "./ContactAvatar";

/** Имя участника как в контакте (без склонения); «Я» — для пользователя. */
export function useParticipantName(): (ref: string) => string {
	const { t } = useTranslation(ENTITY_DEBT_NS);
	const contactsById = useDebtStore((s) => s.contactsById);
	return (ref) => (ref === ME_REF ? t("me") : (contactsById[ref]?.name ?? ""));
}

/** Аватар участника; у «Я» — тёмный круг с «Я». */
export function ParticipantAvatar({
	participantRef,
	className,
	muted,
}: {
	participantRef: string;
	className?: string;
	/** Участник исключён из деления. */
	muted?: boolean;
}) {
	const { t } = useTranslation(ENTITY_DEBT_NS);
	const contact = useDebtStore((s) => (participantRef === ME_REF ? undefined : s.contactsById[participantRef]));
	const classes = cn(muted && "opacity-45", className);
	if (contact) return <ContactAvatar contact={contact} className={classes} />;
	return (
		<span
			aria-hidden="true"
			className={cn(
				"bg-foreground text-background inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
				classes,
			)}
		>
			{t("me")}
		</span>
	);
}
