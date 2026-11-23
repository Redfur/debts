import { injectTranslation } from "@/shared/lib/i18n";
import { SETTLE_CONTACT_NS, settleContactTranslations } from "./translations";

injectTranslation(SETTLE_CONTACT_NS, settleContactTranslations);

export { showSettleContactDialog } from "./ui/SettleContactDialog";
