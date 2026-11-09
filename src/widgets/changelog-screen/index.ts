import { injectTranslation } from "@/shared/lib/i18n";
import { CHANGELOG_SCREEN_NS, changelogScreenTranslations } from "./translations";

injectTranslation(CHANGELOG_SCREEN_NS, changelogScreenTranslations);

export { ChangelogScreen } from "./ui/ChangelogScreen";
