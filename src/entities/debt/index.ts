import { injectTranslation } from "@/shared/lib/i18n";
import { ENTITY_DEBT_NS, entityDebtTranslations } from "./translations";

injectTranslation(ENTITY_DEBT_NS, entityDebtTranslations as Record<string, Record<string, string>>);

export { computeContactSummary } from "./model/compute-contact-summary";
export { computeContactTotals } from "./model/compute-contact-totals";
export { computeDebtBalance } from "./model/compute-debt-balance";
export { computeNetPosition } from "./model/compute-net-position";
export { computeGlobalTotals } from "./model/compute-totals";
export { contactMatchesFilter, countContactsByDirection } from "./model/count-contacts-by-direction";
export { useDebtStore } from "./model/debt-store";
export type {
	Contact,
	ContactDirectionFilter,
	ContactTotals,
	Debt,
	DebtOperation,
	NetPosition,
} from "./model/types";
export { useDebtOperations } from "./model/use-debt-operations";
export { AmountPill } from "./ui/AmountPill";
export { ContactAvatar } from "./ui/ContactAvatar";
export { ContactRow, ContactRowList } from "./ui/ContactRow";
export { DebtStatusBadge } from "./ui/DebtStatusBadge";
export { DirectionChip } from "./ui/DirectionChip";
export { DirectionIcon } from "./ui/DirectionIcon";
export { NetPositionLine, RatioBar } from "./ui/NetPosition";
export { ENTITY_DEBT_NS };
