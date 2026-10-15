import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { ENTITY_DEBT_NS } from "../translations";

/** Бейдж «✓ Погашен». */
export function DebtStatusBadge({ className }: { className?: string }) {
	const { t } = useTranslation(ENTITY_DEBT_NS);
	return (
		<Badge variant="neutral" className={className}>
			<Check strokeWidth={2.6} />
			{t("statusClosed")}
		</Badge>
	);
}
