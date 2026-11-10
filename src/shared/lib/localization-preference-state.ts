import { CLIENT_STORAGE_KEYS } from "./client-storage-keys.ts";

export type AppLanguage = "ru" | "en";
export type LanguagePreference = "system" | AppLanguage;
export type NumberFormat = "space-comma" | "space-dot" | "comma-dot" | "dot-comma";
export type NumberFormatPreference = "language" | NumberFormat;

function resolveLanguage(preference: LanguagePreference, languages: readonly string[]): AppLanguage {
	if (preference !== "system") return preference;
	for (const locale of languages) {
		const base = locale.toLowerCase().split("-")[0];
		if (base === "ru" || base === "en") return base;
	}
	return "en";
}

export function resolveNumberFormat(preference: NumberFormatPreference, language: AppLanguage): NumberFormat {
	return preference === "language" ? (language === "ru" ? "space-comma" : "comma-dot") : preference;
}

export function createLocalizationPreferences(
	storage: Pick<Storage, "getItem" | "setItem"> | undefined,
	getLanguages: () => readonly string[],
) {
	const read = (key: string) => {
		try {
			return storage?.getItem(key);
		} catch {
			return null;
		}
	};
	const storedLanguage = read(CLIENT_STORAGE_KEYS.language);
	const storedFormat = read(CLIENT_STORAGE_KEYS.numberFormat);
	let languagePreference: LanguagePreference =
		storedLanguage === "ru" || storedLanguage === "en" ? storedLanguage : "system";
	let numberFormatPreference: NumberFormatPreference =
		storedFormat === "space-comma" ||
		storedFormat === "space-dot" ||
		storedFormat === "comma-dot" ||
		storedFormat === "dot-comma"
			? storedFormat
			: "language";
	const compute = () => {
		const language = resolveLanguage(languagePreference, getLanguages());
		return {
			languagePreference,
			numberFormatPreference,
			language,
			numberFormat: resolveNumberFormat(numberFormatPreference, language),
		};
	};
	let snapshot = compute();
	const listeners = new Set<() => void>();
	const publish = () => {
		const next = compute();
		if (Object.keys(next).every((key) => next[key as keyof typeof next] === snapshot[key as keyof typeof next])) return;
		snapshot = next;
		for (const listener of listeners) listener();
	};
	const write = (key: string, value: string) => {
		try {
			storage?.setItem(key, value);
		} catch {
			/* Недоступное хранилище не мешает настройкам сеанса. */
		}
	};
	return {
		getSnapshot: () => snapshot,
		subscribe(listener: () => void) {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		setLanguage(value: LanguagePreference) {
			languagePreference = value;
			write(CLIENT_STORAGE_KEYS.language, value);
			publish();
		},
		setNumberFormat(value: NumberFormatPreference) {
			numberFormatPreference = value;
			write(CLIENT_STORAGE_KEYS.numberFormat, value);
			publish();
		},
		refreshSystemLanguage: publish,
		reset() {
			languagePreference = "system";
			numberFormatPreference = "language";
			publish();
		},
	};
}
