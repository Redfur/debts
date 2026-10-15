import { matchPath, useLocation } from "react-router-dom";

export type NavSection = "home" | "contacts" | "settings" | null;

/**
 * Режим каркаса: `section` — разделы с меню и кнопкой «+»;
 * `fullscreen` — вложенные экраны (новый долг, карточка контакта, счёт и его форма) на мобильном открываются без меню.
 */
export type ShellMode = "section" | "fullscreen";

export function useShellMode(): ShellMode {
	const { pathname } = useLocation();
	return matchPath("/new", pathname) || matchPath("/contacts/:contactId", pathname) || matchPath("/bills/*", pathname)
		? "fullscreen"
		: "section";
}

/** Раздел для бокового меню (десктоп): карточка контакта всегда в «Контактах», счёт и его форма — в «Главной». */
export function useSideNavSection(): NavSection {
	const { pathname } = useLocation();
	if (pathname === "/settings") return "settings";
	if (pathname === "/" || pathname === "/new" || pathname.startsWith("/bills/")) return "home";
	if (pathname === "/contacts" || pathname.startsWith("/contacts/")) return "contacts";
	return null;
}
