import { useLocation } from "react-router-dom";

export type NavSection = "home" | "contacts" | "settings" | null;

type ContactDetailOrigin = "home" | "contacts";

/**
 * `/contacts/:id` обслуживает и «Главную», и «Контакты» — какая вкладка подсвечена,
 * зависит от того, откуда пришли (передаётся через `location.state.from` в `<Link>`).
 * Без состояния (прямой переход по ссылке) считаем «Контакты» — это соответствует префиксу URL.
 */
export function useActiveNavSection(): NavSection {
	const { pathname, state } = useLocation();

	if (pathname === "/settings") return "settings";
	if (pathname === "/" || pathname === "/new") return "home";
	if (pathname === "/contacts") return "contacts";
	if (pathname.startsWith("/contacts/")) {
		const from = (state as { from?: ContactDetailOrigin } | null)?.from;
		return from === "home" ? "home" : "contacts";
	}
	return null;
}
