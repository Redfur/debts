import { initPwaUpdate } from "@/features/pwa-app-update/model/init-pwa-update";
import { PWA_APP_UPDATE_NS, pwaAppUpdateTranslations } from "@/features/pwa-app-update/translations";
import { injectTranslation } from "@/shared/lib/i18n";

injectTranslation(PWA_APP_UPDATE_NS, pwaAppUpdateTranslations as Record<string, Record<string, string>>);

export { initPwaUpdate };
