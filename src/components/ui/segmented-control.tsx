import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import type * as React from "react";

import { cn } from "@/shared/lib/utils";

/**
 * Сегментированный переключатель (одиночный выбор): тема, фильтр, направление долга.
 * Пустое значение не допускается — повторное нажатие на выбранный сегмент ничего не меняет.
 */
function SegmentedControl({
	className,
	value,
	onValueChange,
	...props
}: Omit<React.ComponentProps<typeof ToggleGroupPrimitive.Root>, "type" | "value" | "onValueChange" | "defaultValue"> & {
	value: string;
	onValueChange: (value: string) => void;
}) {
	return (
		<ToggleGroupPrimitive.Root
			data-slot="segmented-control"
			type="single"
			value={value}
			onValueChange={(next) => {
				if (next) onValueChange(next);
			}}
			className={cn("grid auto-cols-fr grid-flow-col gap-1 rounded-full bg-secondary p-1", className)}
			{...props}
		/>
	);
}

function SegmentedControlItem({ className, ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
	return (
		<ToggleGroupPrimitive.Item
			data-slot="segmented-control-item"
			className={cn(
				"touch-target inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-card data-[state=on]:font-semibold data-[state=on]:text-foreground data-[state=on]:shadow-card [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
				className,
			)}
			{...props}
		/>
	);
}

export { SegmentedControl, SegmentedControlItem };
