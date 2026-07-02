import { CLIENT_STORAGE_KEYS } from "@/shared/lib/client-storage-keys";

const THEME_KEY = CLIENT_STORAGE_KEYS.theme;

type Theme = "light" | "dark";

/** Режим темы: системная (по умолчанию) или явная светлая/тёмная. */
export type ThemePreference = "system" | "light" | "dark";

function getSystemTheme(): Theme {
	if (typeof window === "undefined") return "light";
	return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readStoredPreference(): ThemePreference | null {
	if (typeof localStorage === "undefined") return null;
	try {
		const stored = localStorage.getItem(THEME_KEY);
		if (stored === "system" || stored === "light" || stored === "dark") return stored;
	} catch {
		/* ignore */
	}
	return null;
}

export function getThemePreference(): ThemePreference {
	return readStoredPreference() ?? "system";
}

/** Эффективная светлая/тёмная тема с учётом режима «системная». */
function getResolvedTheme(): Theme {
	const pref = getThemePreference();
	if (pref === "system") return getSystemTheme();
	return pref;
}

export const THEME_CHANGE_EVENT = "app-theme-change";

export type ThemeChangeDetail = {
	preference: ThemePreference;
	resolved: Theme;
};

function applyDarkClass(resolved: Theme): void {
	if (typeof document === "undefined") return;
	document.documentElement.classList.toggle("dark", resolved === "dark");
}

function dispatchThemeChange(preference: ThemePreference, resolved: Theme): void {
	if (typeof window === "undefined") return;
	window.dispatchEvent(
		new CustomEvent<ThemeChangeDetail>(THEME_CHANGE_EVENT, {
			detail: { preference, resolved },
		}),
	);
}

let mediaQuery: MediaQueryList | null = null;
let mediaHandler: (() => void) | null = null;

function detachSystemListener(): void {
	if (mediaQuery && mediaHandler) {
		mediaQuery.removeEventListener("change", mediaHandler);
	}
	mediaQuery = null;
	mediaHandler = null;
}

function attachSystemListener(): void {
	if (typeof window === "undefined") return;
	detachSystemListener();
	mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
	mediaHandler = () => {
		if (getThemePreference() !== "system") return;
		const resolved = getResolvedTheme();
		applyDarkClass(resolved);
		dispatchThemeChange("system", resolved);
	};
	mediaQuery.addEventListener("change", mediaHandler);
}

/** Применить класс `dark` по текущему предпочтению и подписаться на системную тему при необходимости. */
function applyThemePreference(): void {
	const preference = getThemePreference();
	const resolved = getResolvedTheme();
	applyDarkClass(resolved);
	if (preference === "system") {
		attachSystemListener();
	} else {
		detachSystemListener();
	}
	dispatchThemeChange(preference, resolved);
}

export function setThemePreference(preference: ThemePreference): void {
	const prev = readStoredPreference() ?? "system";
	if (prev === preference) return;
	try {
		localStorage.setItem(THEME_KEY, preference);
	} catch {
		/* ignore */
	}
	applyThemePreference();
}

export function initTheme(): void {
	applyThemePreference();
}
