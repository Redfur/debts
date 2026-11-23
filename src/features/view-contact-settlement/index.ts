import { injectTranslation } from "@/shared/lib/i18n";
import { SETTLEMENT_DETAILS_NS, settlementDetailsTranslations } from "./translations";

injectTranslation(SETTLEMENT_DETAILS_NS, settlementDetailsTranslations);

export { showContactSettlementDetails } from "./ui/ContactSettlementDetails";
