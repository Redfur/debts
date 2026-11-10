import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { localizationPreferences } from "./localization-preference";

const defaultNs = "common";

i18n.use(initReactI18next).init({
	lng: localizationPreferences.getSnapshot().language,
	fallbackLng: "en",
	supportedLngs: ["ru", "en"],
	resources: {},
	defaultNS: defaultNs,
	interpolation: {
		escapeValue: false,
	},
});

localizationPreferences.subscribe(() => {
	const { language } = localizationPreferences.getSnapshot();
	if (i18n.language !== language) void i18n.changeLanguage(language);
});

export { i18n };

export function injectTranslation(namespace: string, resources: Record<string, Record<string, string>>) {
	for (const [lang, translations] of Object.entries(resources)) {
		i18n.addResourceBundle(lang, namespace, translations, true, true);
	}
}
