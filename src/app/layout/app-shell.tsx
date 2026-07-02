import { Home, Settings, Users } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useDebtStore } from "@/entities/debt";
import { COMMON_NS } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { AppNavLink } from "./AppNavLink";
import { StorageErrorBanner } from "./StorageErrorBanner";
import { useActiveNavSection } from "./use-active-nav-section";

type Props = {
	children: ReactNode;
};

/**
 * Десктоп: фиксированный сайдбар слева; мобилка: нижняя навигация.
 * Контент в центрированной колонке ограниченной ширины.
 */
export function AppShell({ children }: Props) {
	const { t } = useTranslation(COMMON_NS);
	const lastError = useDebtStore((s) => s.lastError);
	const section = useActiveNavSection();

	const items = [
		{ to: "/", label: t("navHome"), icon: Home, isActive: section === "home" },
		{ to: "/contacts", label: t("navContacts"), icon: Users, isActive: section === "contacts" },
		{ to: "/settings", label: t("navSettings"), icon: Settings, isActive: section === "settings" },
	];

	return (
		<div className="bg-background flex min-h-svh flex-col">
			<StorageErrorBanner />

			<aside className="border-border bg-background fixed top-0 left-0 z-30 hidden h-svh w-64 flex-col border-r pt-4 lg:flex">
				<nav className="flex flex-col gap-1 p-3">
					{items.map((item) => (
						<AppNavLink key={item.to} variant="sidebar" {...item} />
					))}
				</nav>
			</aside>

			<main
				className={cn(
					"flex flex-1 flex-col pb-20 lg:pb-8 lg:pl-64 [@media(display-mode:standalone)_and_(max-width:1023px)]:pb-[calc(5rem+env(safe-area-inset-bottom,0px))]",
					lastError && "pt-10",
				)}
			>
				<div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 sm:px-6 lg:max-w-4xl lg:pb-2 lg:pt-0">
					{children}
				</div>
			</main>

			<nav className="border-border bg-background/95 supports-backdrop-filter:bg-background/80 fixed right-0 bottom-0 left-0 z-40 border-t backdrop-blur lg:hidden [@media(display-mode:standalone)]:pb-[env(safe-area-inset-bottom,0px)]">
				<div className="mx-auto flex max-w-2xl justify-between gap-0.5 px-4 py-2 sm:gap-1">
					{items.map((item) => (
						<AppNavLink key={item.to} variant="bottom" {...item} />
					))}
				</div>
			</nav>
		</div>
	);
}
