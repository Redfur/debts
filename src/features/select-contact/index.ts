import { injectTranslation } from "@/shared/lib/i18n";
import { SELECT_CONTACT_NS, selectContactTranslations } from "./translations";

injectTranslation(SELECT_CONTACT_NS, selectContactTranslations as Record<string, Record<string, string>>);

export { ContactCombobox } from "./ui/ContactCombobox";
