import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type ScreenBodyGap = "compact" | "comfortable";

type Props = {
	children: ReactNode;
	/** Расстояние между блоками под шапкой (только `variant="page"`). */
	gap?: ScreenBodyGap;
	/**
	 * `page` — обычный экран с липкой шапкой (верхний отступ внутри шапки).
	 * `skeleton` — полноэкранный скелетон без липкой первой строки.
	 * `skeletonSticky` — первый ребёнок с **PageHeaderSkeleton** / липкой шапкой.
	 */
	variant?: "page" | "skeleton" | "skeletonSticky";
	className?: string;
};

const gapClass: Record<ScreenBodyGap, string> = {
	compact: "gap-3",
	comfortable: "gap-6",
};

/**
 * Единая обёртка тела экрана под `AppShell`: нижний отступ и согласованные верхние отступы со **STICKY_PAGE_HEADER_SURFACE**.
 */
export function ScreenBody({ children, gap = "comfortable", variant = "page", className }: Props) {
	return (
		<div
			className={cn(
				"flex flex-col pb-4",
				variant === "page" && cn("animate-in fade-in pt-0 duration-300", gapClass[gap]),
				variant === "skeleton" && "gap-4 pt-4 lg:pt-6",
				variant === "skeletonSticky" && "gap-4 pt-0",
				className,
			)}
		>
			{children}
		</div>
	);
}
