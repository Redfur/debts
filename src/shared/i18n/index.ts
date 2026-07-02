import { injectTranslation } from "@/shared/lib/i18n";
import { commonTranslations } from "./translations";

export const COMMON_NS = "common";

injectTranslation(COMMON_NS, commonTranslations as Record<string, Record<string, string>>);
