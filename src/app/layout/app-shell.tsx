import type { ReactNode } from "react";
import { PageHeaderAfterSlot } from "@/shared/layout";
import { cn } from "@/shared/lib/utils";
import { BottomNav } from "./BottomNav";
import { CreateFab } from "./CreateFab";
import { SideNav } from "./SideNav";
import { StorageErrorBanner } from "./StorageErrorBanner";
import { useShellMode, useSideNavSection } from "./use-active-nav-section";

type Props = {
	children: ReactNode;
};

/**
 * Каркас: на мобильном — плавающее нижнее меню и «+» в разделах; вложенные экраны (новый долг,
 * карточка контакта) — на весь экран без меню. На ширине от 1024 px — боковое меню и «+» справа внизу.
 */
export function AppShell({ children }: Props) {
	const mode = useShellMode();
	const section = useSideNavSection();
	const showFab = section !== null && !(section === "home" && mode === "fullscreen");

	return (
		<div className="bg-background flex min-h-svh flex-col">
			<SideNav active={section} />

			<main
				className={cn(
					"flex flex-1 flex-col lg:pl-60",
					mode === "section"
						? "pb-[calc(110px+env(safe-area-inset-bottom,0px))]"
						: "pb-[env(safe-area-inset-bottom,0px)]",
					"lg:pb-12",
				)}
			>
				<div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 lg:max-w-[1160px] lg:px-10">
					<PageHeaderAfterSlot.Provider value={<StorageErrorBanner />}>{children}</PageHeaderAfterSlot.Provider>
				</div>
			</main>

			{mode === "section" ? <BottomNav active={section} /> : null}
			{showFab ? <CreateFab className="fixed right-8 bottom-8 z-40 hidden lg:flex" /> : null}
		</div>
	);
}
