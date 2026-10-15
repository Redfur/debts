import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";

import { cn } from "@/shared/lib/utils";

type Props = {
	to: string;
	ariaLabel: string;
	replace?: boolean;
	className?: string;
};

/** Кнопка «назад» 44×44 без фона. */
export function PageHeaderBackLink({ to, ariaLabel, replace, className }: Props) {
	return (
		<Link
			to={to}
			replace={replace}
			aria-label={ariaLabel}
			className={cn(
				"text-foreground flex size-11 items-center justify-center rounded-full outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring",
				className,
			)}
		>
			<ChevronLeft className="size-6" strokeWidth={2.2} aria-hidden="true" />
		</Link>
	);
}
