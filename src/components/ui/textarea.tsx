import type * as React from "react";
import { cn } from "@/shared/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
	return (
		<textarea
			data-slot="textarea"
			className={cn(
				"flex field-sizing-content min-h-12 w-full rounded-field border-0 bg-secondary px-3.5 py-3 text-[16px] text-foreground transition-shadow outline-none placeholder:text-muted-foreground focus-visible:shadow-[inset_0_0_0_2px_var(--ring)] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:shadow-[inset_0_0_0_2px_var(--destructive)] lg:text-[15px]",
				className,
			)}
			{...props}
		/>
	);
}

export { Textarea };
