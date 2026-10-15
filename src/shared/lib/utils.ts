import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge с утилитами дизайн-системы из `src/index.css`: без этого `text-amount-xl` и т.п.
 * считались бы цветом текста и выбрасывались рядом с `text-muted-foreground`,
 * а `rounded-control` не заменял бы `rounded-full` из базовых классов компонента.
 */
const twMerge = extendTailwindMerge({
	extend: {
		classGroups: {
			"font-size": [
				{
					text: [
						"amount-display",
						"amount-xl",
						"amount-l",
						"title",
						"title-desktop",
						"heading",
						"body",
						"body-s",
						"caption",
						"label-nav",
					],
				},
			],
			rounded: [{ rounded: ["chip", "field", "control", "card", "sheet"] }],
		},
	},
});

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
