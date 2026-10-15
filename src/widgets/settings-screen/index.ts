import { injectTranslation } from "@/shared/lib/i18n";
import { SETTINGS_SCREEN_NS, settingsScreenTranslations } from "./translations";

injectTranslation(SETTINGS_SCREEN_NS, settingsScreenTranslations as Record<string, Record<string, string>>);

export { SettingsScreen } from "./ui/SettingsScreen";
