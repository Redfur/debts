import { Search, X } from "lucide-react";
import type * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/shared/lib/utils";

type Props = Omit<React.ComponentProps<typeof Input>, "type" | "value" | "onChange"> & {
	value: string;
	onValueChange: (value: string) => void;
	/** Подпись для экранного диктора. */
	label: string;
	/** Подпись кнопки очистки; без неё кнопка не показывается. */
	clearLabel?: string;
	/** Поле на белой карточке с тенью (список) или на сером фоне (форма). */
	surface?: "card" | "field";
};

/** Поле поиска с иконкой и кнопкой «Очистить». */
export function SearchField({ value, onValueChange, label, clearLabel, surface = "card", className, ...props }: Props) {
	return (
		<div
			className={cn(
				"text-muted-foreground flex min-h-12 items-center gap-2.5 rounded-[16px] pr-1 pl-3.5 focus-within:shadow-[inset_0_0_0_2px_var(--ring)]",
				surface === "card" ? "bg-card shadow-card" : "bg-secondary",
				className,
			)}
		>
			<Search className="size-[18px] shrink-0" strokeWidth={2.2} aria-hidden="true" />
			<Input
				type="search"
				aria-label={label}
				value={value}
				onChange={(e) => onValueChange(e.target.value)}
				className="min-h-11 flex-1 bg-transparent px-0 focus-visible:shadow-none [&::-webkit-search-cancel-button]:hidden"
				{...props}
			/>
			{clearLabel && value ? (
				<button
					type="button"
					aria-label={clearLabel}
					onClick={() => onValueChange("")}
					className="text-muted-foreground hover:text-foreground flex size-11 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					<X className="size-[18px]" />
				</button>
			) : null}
		</div>
	);
}
