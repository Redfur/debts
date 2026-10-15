import { matchPath, useLocation } from "react-router-dom";

export type NavSection = "home" | "contacts" | "settings" | null;

/**
 * Режим каркаса: `section` — разделы с меню и кнопкой «+»;
 * `fullscreen` — вложенные экраны (новый долг, карточка контакта) на мобильном открываются без меню.
 */
export type ShellMode = "section" | "fullscreen";

export function useShellMode(): ShellMode {
	const { pathname } = useLocation();
	return matchPath("/new", pathname) || matchPath("/contacts/:contactId", pathname) ? "fullscreen" : "section";
}

/** Раздел для бокового меню (десктоп): карточка контакта всегда в «Контактах». */
export function useSideNavSection(): NavSection {
	const { pathname } = useLocation();
	if (pathname === "/settings") return "settings";
	if (pathname === "/" || pathname === "/new") return "home";
	if (pathname === "/contacts" || pathname.startsWith("/contacts/")) return "contacts";
	return null;
}
