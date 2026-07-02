import { injectTranslation } from "@/shared/lib/i18n";
import { CREATE_DEBT_NS, createDebtTranslations } from "./translations";

injectTranslation(CREATE_DEBT_NS, createDebtTranslations as Record<string, Record<string, string>>);

export { showCreateDebtDialog } from "./ui/CreateDebtDialog";
