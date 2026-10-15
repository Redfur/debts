import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { COMMON_NS } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { CreateFab } from "./CreateFab";
import { NAV_ITEMS } from "./nav-items";
import type { NavSection } from "./use-active-nav-section";

/** Мобильное меню: плавающая «стеклянная» панель разделов и круглая кнопка «+» справа. */
export function BottomNav({ active }: { active: NavSection }) {
	const { t } = useTranslation(COMMON_NS);

	return (
		<div className="fixed inset-x-4 bottom-[calc(24px+env(safe-area-inset-bottom,0px))] z-40 flex items-center gap-2.5 lg:hidden">
			<nav aria-label={t("navLabel")} className="nav-glass shadow-nav flex h-15 flex-1 gap-1 rounded-full p-1.5">
				{NAV_ITEMS.map(({ to, section, labelKey, icon: Icon }) => {
					const isActive = active === section;
					return (
						<Link
							key={to}
							to={to}
							aria-current={isActive ? "page" : undefined}
							className={cn(
								"text-label-nav flex flex-1 flex-col items-center justify-center gap-0.5 rounded-full font-medium text-muted-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
								isActive && "bg-nav-glass-active font-semibold text-foreground",
							)}
						>
							<Icon className="size-5" aria-hidden="true" />
							{t(labelKey)}
						</Link>
					);
				})}
			</nav>
			<CreateFab />
		</div>
	);
}
