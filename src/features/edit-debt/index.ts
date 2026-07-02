import { injectTranslation } from "@/shared/lib/i18n";
import { EDIT_DEBT_NS, editDebtTranslations } from "./translations";

injectTranslation(EDIT_DEBT_NS, editDebtTranslations as Record<string, Record<string, string>>);

export { showEditDebtDialog } from "./ui/EditDebtDialog";
