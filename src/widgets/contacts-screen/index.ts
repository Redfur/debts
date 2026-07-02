import { injectTranslation } from "@/shared/lib/i18n";
import { CONTACTS_SCREEN_NS, contactsScreenTranslations } from "./translations";

injectTranslation(CONTACTS_SCREEN_NS, contactsScreenTranslations as Record<string, Record<string, string>>);

export { ContactsScreen } from "./ui/ContactsScreen";
