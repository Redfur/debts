import { createContext, type ReactNode, useContext } from "react";

import { cn } from "@/shared/lib/utils";

/**
 * Содержимое, которое каркас приложения показывает сразу под заголовком любого экрана
 * (баннер ошибки хранилища). Задаётся в `app`, чтобы `shared` не зависел от сущностей.
 */
export const PageHeaderAfterSlot = createContext<ReactNode>(null);

type Props = {
	/** Кнопка «назад» и т.п. слева от заголовка (в строке над ним). */
	leading?: ReactNode;
	/** Классы строки с `leading` (например, скрыть «назад» на десктопе). */
	leadingClassName?: string;
	/** Иконка или медиа перед заголовком */
	media?: ReactNode;
	/** Заголовок страницы */
	title?: ReactNode;
	/** Мелкий текст рядом с заголовком (счётчик). */
	titleAside?: ReactNode;
	description?: ReactNode;
	/** Кнопки справа */
	actions?: ReactNode;
	className?: string;
};

export function PageHeader({
	leading,
	leadingClassName,
	media,
	title,
	titleAside,
	description,
	actions,
	className,
}: Props) {
	const after = useContext(PageHeaderAfterSlot);

	return (
		<>
			<header className={cn("flex flex-col gap-1 pt-[calc(env(safe-area-inset-top,0px)+20px)] lg:pt-9", className)}>
				{leading ? <div className={cn("-ml-2.5 flex min-h-11 items-center", leadingClassName)}>{leading}</div> : null}
				<div className="flex min-h-11 items-center gap-3.5">
					{media ? <div className="shrink-0">{media}</div> : null}
					<div className="min-w-0 flex-1">
						<h1 className="text-title lg:text-title-desktop flex items-baseline gap-2 break-words">
							<span className="min-w-0">{title}</span>
							{titleAside ? (
								<span className="text-muted-foreground text-[17px] leading-6 font-medium tracking-normal">
									{titleAside}
								</span>
							) : null}
						</h1>
						{description ? <div className="text-muted-foreground text-caption mt-0.5">{description}</div> : null}
					</div>
					{actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
				</div>
			</header>
			{after}
		</>
	);
}
