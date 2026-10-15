import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/shared/lib/utils";

/** Пилюля статуса: «✓ Погашен», «Нет курса», «Ошибка» и т.п. */
const badgeVariants = cva(
	"inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[13px] leading-[18px] font-semibold whitespace-nowrap [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
	{
		variants: {
			variant: {
				neutral: "bg-muted text-foreground",
				warning: "bg-warning-muted text-warning",
				destructive: "bg-destructive-muted text-destructive-strong",
				accent: "bg-accent-muted text-accent-strong font-medium",
			},
		},
		defaultVariants: {
			variant: "neutral",
		},
	},
);

function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
	return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge };
