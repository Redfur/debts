import { useTranslation } from "react-i18next";
import type { DebtDirection } from "@/shared/lib/storage";
import { cn } from "@/shared/lib/utils";
import { ENTITY_DEBT_NS } from "../translations";

/** Метка направления на карточке долга: «+ Мне должны» / «− Я должен». */
export function DirectionChip({ direction, className }: { direction: DebtDirection; className?: string }) {
	const { t } = useTranslation(ENTITY_DEBT_NS);
	const owedToMe = direction === "owed_to_me";
	return (
		<span
			className={cn(
				"inline-flex rounded-full px-2.5 py-[3px] text-[13px] leading-[18px] font-semibold whitespace-nowrap",
				owedToMe ? "bg-owed-to-me-muted text-owed-to-me-strong" : "bg-i-owe-muted text-i-owe-strong",
				className,
			)}
		>
			{owedToMe ? `+ ${t("directionOwedToMe")}` : `− ${t("directionIOwe")}`}
		</span>
	);
}
