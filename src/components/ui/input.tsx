import type * as React from "react";

import { cn } from "@/shared/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
	return (
		<input
			type={type}
			data-slot="input"
			className={cn(
				"min-h-12 w-full min-w-0 rounded-field border-0 bg-secondary px-3.5 text-[16px] text-foreground transition-shadow outline-none placeholder:text-muted-foreground focus-visible:shadow-[inset_0_0_0_2px_var(--ring)] disabled:pointer-events-none disabled:bg-transparent disabled:text-muted-foreground disabled:shadow-[inset_0_0_0_1px_var(--border)] aria-invalid:shadow-[inset_0_0_0_2px_var(--destructive)] lg:text-[15px]",
				className,
			)}
			{...props}
		/>
	);
}

export { Input };
