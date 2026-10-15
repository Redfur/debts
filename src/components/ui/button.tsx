import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

import { cn } from "@/shared/lib/utils";

/**
 * Кнопки по дизайн-системе: пилюля, высота 44 (в формах и шторках — `lg`, 52),
 * кольцо фокуса 2px с отступом 2px. Зона касания любого размера — не меньше 44×44 (`touch-target`).
 */
const buttonVariants = cva(
	"group/button touch-target inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border-0 font-sans text-sm font-semibold whitespace-nowrap transition-[background-color,transform,box-shadow] outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:not-aria-[haspopup]:scale-[0.97] disabled:pointer-events-none disabled:bg-muted disabled:text-muted-foreground aria-invalid:ring-2 aria-invalid:ring-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
	{
		variants: {
			variant: {
				/** Тёмная основная («Погасить»). */
				default: "bg-primary text-primary-foreground hover:bg-primary/88 active:bg-primary/80",
				/** Акцент индиго — создание («Создать», «+»). */
				accent: "bg-accent text-accent-foreground hover:bg-accent/90 active:bg-accent/80",
				/** Мягкая («Отмена», «Изменить», вторичные действия). */
				secondary:
					"bg-secondary text-secondary-foreground hover:bg-muted active:bg-muted aria-expanded:bg-muted dark:bg-secondary",
				/** Совместимость со старыми местами вызова: выглядит как `secondary`. */
				outline: "bg-secondary text-secondary-foreground hover:bg-muted active:bg-muted aria-expanded:bg-muted",
				/** Необратимые действия («Удалить», «Заменить данные»). */
				destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80",
				/** Мягкая опасная кнопка в строках сброса на десктопе («Удалить данные»). */
				"destructive-soft":
					"bg-destructive-muted text-destructive-strong hover:bg-destructive-muted/80 active:bg-destructive-muted/70",
				/** Текстовое опасное действие внутри строк. */
				"destructive-ghost": "bg-transparent text-destructive hover:bg-destructive-muted active:bg-destructive-muted",
				ghost: "bg-transparent hover:bg-secondary hover:text-foreground aria-expanded:bg-secondary",
				link: "rounded-md text-accent underline-offset-4 hover:underline",
			},
			size: {
				default: "h-11 px-5",
				sm: "h-9 px-4 text-[13px]",
				lg: "h-13 px-6 text-base",
				icon: "size-11",
				"icon-sm": "size-9",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

function Button({
	className,
	variant = "default",
	size = "default",
	asChild = false,
	...props
}: React.ComponentProps<"button"> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
	}) {
	const Comp = asChild ? Slot.Root : "button";

	return (
		<Comp
			data-slot="button"
			data-variant={variant}
			data-size={size}
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
