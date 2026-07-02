import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

import { STICKY_PAGE_HEADER_SURFACE } from "../lib/sticky-header-surface";

type Props = {
	/** Кнопка «назад» и т.п. слева */
	leading?: ReactNode;
	/** Иконка или медиа перед заголовком */
	media?: ReactNode;
	/** Заголовок страницы (не используется вместе с `centerContent`) */
	title?: ReactNode;
	description?: ReactNode;
	/**
	 * Центральная зона вместо media + title + description (например **DayNavigation**).
	 * Заголовок страницы для a11y остаётся отдельно (например `sr-only` `h1` на экране дня).
	 */
	centerContent?: ReactNode;
	/** Кнопки справа */
	actions?: ReactNode;
	className?: string;
};

export function PageHeader({ leading, media, title, description, centerContent, actions, className }: Props) {
	const useCenter = centerContent != null;

	return (
		<div className={cn(STICKY_PAGE_HEADER_SURFACE, "flex flex-wrap gap-2 sm:gap-3 items-center", className)}>
			{leading ? <div className={cn("flex shrink-0", !useCenter && "items-start pt-0.5")}>{leading}</div> : null}
			{useCenter ? (
				<div className="min-w-0 flex-1">{centerContent}</div>
			) : (
				<div className="flex min-w-0 flex-1 items-start gap-3">
					{media ? <div className="shrink-0">{media}</div> : null}
					<div className="min-w-0 flex-1">
						<h1 className="text-xl font-semibold wrap-break-word">{title}</h1>
						{description ? <div className="text-muted-foreground mt-0.5 text-xs">{description}</div> : null}
					</div>
				</div>
			)}
			{actions ? (
				<div className={cn("flex shrink-0 flex-wrap items-center gap-2", !useCenter && "pt-0.5")}>{actions}</div>
			) : null}
		</div>
	);
}
