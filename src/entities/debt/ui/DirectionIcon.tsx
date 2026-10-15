import { Minus, Plus } from "lucide-react";
import type { DebtDirection } from "@/shared/lib/storage";
import { cn } from "@/shared/lib/utils";

/** Круг со знаком «+» / «−» в цвете направления (заголовки карточек итогов). */
export function DirectionIcon({ direction, className }: { direction: DebtDirection; className?: string }) {
	const Icon = direction === "owed_to_me" ? Plus : Minus;
	return (
		<span
			aria-hidden="true"
			className={cn(
				"inline-flex size-[22px] shrink-0 items-center justify-center rounded-full [&_svg]:size-3.5",
				direction === "owed_to_me" ? "bg-owed-to-me text-owed-to-me-foreground" : "bg-i-owe text-i-owe-foreground",
				className,
			)}
		>
			<Icon strokeWidth={3} />
		</span>
	);
}
