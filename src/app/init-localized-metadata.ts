import { APP_METADATA } from "@/shared/config/app-metadata";
import { localizationPreferences } from "@/shared/lib/localization-preference";

/** До initInstallApp: браузер должен получить актуальный manifest перед beforeinstallprompt. */
export function initLocalizedMetadata() {
	const apply = () => {
		const { language } = localizationPreferences.getSnapshot();
		const metadata = APP_METADATA[language];
		document.documentElement.lang = language;
		document.title = metadata.name;
		document.querySelector('meta[name="description"]')?.setAttribute("content", metadata.description);
		document.querySelector('meta[name="apple-mobile-web-app-title"]')?.setAttribute("content", metadata.name);
		document
			.querySelector('link[rel="manifest"]')
			?.setAttribute(
				"href",
				`${import.meta.env.BASE_URL}${language === "ru" ? "site.webmanifest" : "site.en.webmanifest"}`,
			);
	};
	apply();
	let previousLanguage = localizationPreferences.getSnapshot().language;
	localizationPreferences.subscribe(() => {
		const { language } = localizationPreferences.getSnapshot();
		if (language === previousLanguage) return;
		previousLanguage = language;
		apply();
	});
}
