import { Home, type LucideIcon, SlidersHorizontal, Users } from "lucide-react";
import type { NavSection } from "./use-active-nav-section";

export type NavItem = {
	to: string;
	section: Exclude<NavSection, null>;
	labelKey: "navHome" | "navContacts" | "navSettings";
	icon: LucideIcon;
};

export const NAV_ITEMS: readonly NavItem[] = [
	{ to: "/", section: "home", labelKey: "navHome", icon: Home },
	{ to: "/contacts", section: "contacts", labelKey: "navContacts", icon: Users },
	{ to: "/settings", section: "settings", labelKey: "navSettings", icon: SlidersHorizontal },
];
