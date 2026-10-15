import { injectTranslation } from "@/shared/lib/i18n";
import { SET_DISPLAY_CURRENCY_NS, setDisplayCurrencyTranslations } from "./translations";

injectTranslation(SET_DISPLAY_CURRENCY_NS, setDisplayCurrencyTranslations as Record<string, Record<string, string>>);

export { DisplayCurrencySetting } from "./ui/DisplayCurrencySetting";
