import { Outlet, useParams } from "react-router-dom";
import { cn } from "@/shared/lib/utils";
import { ContactsScreen } from "@/widgets/contacts-screen";

/**
 * Раздел «Контакты»: на мобильном — либо список, либо карточка контакта на весь экран;
 * на ширине от 1024 px — список слева и выбранная карточка справа.
 */
export function ContactsPage() {
	const { contactId } = useParams<{ contactId?: string }>();

	return (
		<div className="flex flex-1 flex-col lg:grid lg:grid-cols-[minmax(300px,380px)_minmax(0,1fr)] lg:items-start lg:gap-8">
			<div className={cn("flex flex-col lg:sticky lg:top-0", contactId && "max-lg:hidden")}>
				<ContactsScreen selectedId={contactId} />
			</div>
			<div className={cn("flex min-w-0 flex-col", !contactId && "max-lg:hidden")}>
				<Outlet />
			</div>
		</div>
	);
}
