import { injectTranslation } from "@/shared/lib/i18n";
import { REFRESH_RATES_NS, refreshExchangeRatesTranslations } from "./translations";

injectTranslation(REFRESH_RATES_NS, refreshExchangeRatesTranslations as Record<string, Record<string, string>>);

export { ExchangeRateStatusRow } from "./ui/ExchangeRateStatusRow";
