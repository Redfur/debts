import { injectTranslation } from "@/shared/lib/i18n";
import { HOME_SCREEN_NS, homeScreenTranslations } from "./translations";

injectTranslation(HOME_SCREEN_NS, homeScreenTranslations as Record<string, Record<string, string>>);

export { HomeScreen } from "./ui/HomeScreen";
