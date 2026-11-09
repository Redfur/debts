import { injectTranslation } from "@/shared/lib/i18n";
import { CURRENCY_PICKER_NS, currencyPickerTranslations } from "./translations";

injectTranslation(CURRENCY_PICKER_NS, currencyPickerTranslations);

export { CurrencyPicker } from "./CurrencyPicker";
