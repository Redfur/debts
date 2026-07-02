import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";

type Props = {
	to: string;
	ariaLabel: string;
	replace?: boolean;
	className?: string;
};

/** Стиль «системной» кнопки назад: без рамки (в отличие от outline у навигации по дням). */
export function PageHeaderBackLink({ to, ariaLabel, replace, className }: Props) {
	return (
		<Button
			type="button"
			variant="ghost"
			size="icon"
			className={cn(
				"text-muted-foreground hover:bg-transparent hover:text-foreground active:bg-transparent",
				"-ml-2 sm:-ml-1",
				className,
			)}
			asChild
		>
			<Link to={to} replace={replace} aria-label={ariaLabel}>
				<ChevronLeft className="size-6" strokeWidth={2.25} />
			</Link>
		</Button>
	);
}
