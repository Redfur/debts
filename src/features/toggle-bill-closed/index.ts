import { injectTranslation } from "@/shared/lib/i18n";
import { TOGGLE_BILL_CLOSED_NS, toggleBillClosedTranslations } from "./translations";

injectTranslation(TOGGLE_BILL_CLOSED_NS, toggleBillClosedTranslations as Record<string, Record<string, string>>);

export { ToggleBillClosedButton } from "./ui/ToggleBillClosedButton";
