import { injectTranslation } from "@/shared/lib/i18n";
import { INSTALL_APP_NS, installAppTranslations } from "./translations";

injectTranslation(INSTALL_APP_NS, installAppTranslations as Record<string, Record<string, string>>);

export { initInstallApp } from "./model/init-install-app";
export { useInstallInvitation } from "./model/use-install-state";
export { InstallBanner, InstallOnboardingCard } from "./ui/InstallInvite";
export { InstallSettingsRows } from "./ui/InstallSettingsRows";
