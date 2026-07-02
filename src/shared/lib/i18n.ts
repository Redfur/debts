import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const defaultNs = "common";

i18n.use(initReactI18next).init({
	lng: "ru",
	fallbackLng: "ru",
	defaultNS: defaultNs,
	interpolation: {
		escapeValue: false,
	},
});

export { i18n };

export function injectTranslation(namespace: string, resources: Record<string, Record<string, string>>) {
	for (const [lang, translations] of Object.entries(resources)) {
		i18n.addResourceBundle(lang, namespace, translations, true, true);
	}
}
