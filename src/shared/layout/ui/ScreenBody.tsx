import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type ScreenBodyGap = "compact" | "comfortable";

type Props = {
	children: ReactNode;
	/** Расстояние между блоками экрана. */
	gap?: ScreenBodyGap;
	/** `page` — обычный экран; `skeleton` — заглушка загрузки (без анимации появления). */
	variant?: "page" | "skeleton";
	className?: string;
};

const gapClass: Record<ScreenBodyGap, string> = {
	compact: "gap-2",
	comfortable: "gap-3",
};

/** Единая обёртка тела экрана под `AppShell`. */
export function ScreenBody({ children, gap = "comfortable", variant = "page", className }: Props) {
	return (
		<div
			aria-busy={variant === "skeleton" ? true : undefined}
			className={cn(
				"flex flex-col pb-4",
				gapClass[gap],
				variant === "page" && "animate-in fade-in duration-300",
				className,
			)}
		>
			{children}
		</div>
	);
}
