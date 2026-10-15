import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { COMMON_NS } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";

/** Круглая кнопка «+» (создание долга). Меню «Новый долг / Разделить счёт» появится вместе с разделением счёта. */
export function CreateFab({ className }: { className?: string }) {
	const { t } = useTranslation(COMMON_NS);
	return (
		<Link
			to="/new"
			aria-label={t("create")}
			className={cn(
				"bg-accent text-accent-foreground shadow-card flex size-15 shrink-0 items-center justify-center rounded-full transition-transform outline-none hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-95",
				className,
			)}
		>
			<Plus className="size-[26px]" strokeWidth={2.4} aria-hidden="true" />
		</Link>
	);
}
