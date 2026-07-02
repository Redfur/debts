import { injectTranslation } from "@/shared/lib/i18n";
import { ADD_REPAYMENT_NS, addRepaymentTranslations } from "./translations";

injectTranslation(ADD_REPAYMENT_NS, addRepaymentTranslations as Record<string, Record<string, string>>);

export { showAddRepaymentDialog } from "./ui/AddRepaymentDialog";
