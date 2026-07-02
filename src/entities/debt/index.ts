import { injectTranslation } from "@/shared/lib/i18n";
import { ENTITY_DEBT_NS, entityDebtTranslations } from "./translations";

injectTranslation(ENTITY_DEBT_NS, entityDebtTranslations as Record<string, Record<string, string>>);

export { computeContactSummary } from "./model/compute-contact-summary";
export { computeDebtBalance } from "./model/compute-debt-balance";
export { computeGlobalTotals } from "./model/compute-totals";
export { useDebtStore } from "./model/debt-store";
export type { Contact, Debt, DebtOperation } from "./model/types";
export { useDebtOperations } from "./model/use-debt-operations";
export { ContactAvatar } from "./ui/ContactAvatar";
export { ContactListItem } from "./ui/ContactListItem";
