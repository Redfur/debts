import { injectTranslation } from "@/shared/lib/i18n";
import { CONTACT_DETAIL_NS, contactDetailTranslations } from "./translations";

injectTranslation(CONTACT_DETAIL_NS, contactDetailTranslations as Record<string, Record<string, string>>);

export { ContactDetailScreen } from "./ui/ContactDetailScreen";
export { ContactNotFound } from "./ui/ContactNotFound";
