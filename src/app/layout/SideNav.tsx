import { Smartphone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { COMMON_NS } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { NAV_ITEMS } from "./nav-items";
import type { NavSection } from "./use-active-nav-section";

/** Знак приложения: карточка с полосами «мне должны» / «я должен» (как на иконке). */
function BrandMark() {
	return (
		<span
			aria-hidden="true"
			className="bg-card border-foreground flex size-8 shrink-0 flex-col justify-center gap-[3px] rounded-[9px] border-[1.5px] px-1.5"
		>
			<span className="bg-owed-to-me h-1 w-full rounded-full" />
			<span className="bg-i-owe h-1 w-3/5 rounded-full" />
		</span>
	);
}

/** Боковое меню на ширине от 1024 px: название, разделы, подпись о локальном хранении. */
export function SideNav({ active }: { active: NavSection }) {
	const { t } = useTranslation(COMMON_NS);

	return (
		<aside className="bg-background border-border fixed inset-y-0 left-0 z-30 hidden w-60 flex-col gap-6 border-r px-4 pt-7 pb-6 lg:flex">
			<Link to="/" className="flex items-center gap-2.5 px-2 text-foreground">
				<BrandMark />
				<span className="text-[19px] leading-6 font-bold tracking-[-0.02em]">{t("appName")}</span>
			</Link>
			<nav aria-label={t("navLabel")} className="flex flex-col gap-0.5">
				{NAV_ITEMS.map(({ to, section, labelKey, icon: Icon }) => {
					const isActive = active === section;
					return (
						<Link
							key={to}
							to={to}
							aria-current={isActive ? "page" : undefined}
							className={cn(
								"flex min-h-11 items-center gap-2.5 rounded-field px-3 text-[15px] text-muted-foreground transition-colors outline-none hover:bg-card focus-visible:ring-2 focus-visible:ring-ring",
								isActive && "bg-card shadow-card font-semibold text-foreground",
							)}
						>
							<Icon className="size-5" aria-hidden="true" />
							{t(labelKey)}
						</Link>
					);
				})}
			</nav>
			<p className="text-muted-foreground mx-2 mt-auto flex gap-2 text-xs leading-4">
				<Smartphone className="mt-px size-3.5 shrink-0" aria-hidden="true" />
				{t("localOnly")}
			</p>
		</aside>
	);
}
