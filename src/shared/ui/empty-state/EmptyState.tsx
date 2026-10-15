import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

type Props = {
	icon?: ReactNode;
	title: ReactNode;
	description?: ReactNode;
	/** Кнопки действий; на мобильном растягиваются на всю ширину. */
	actions?: ReactNode;
	className?: string;
};

/** Пустое состояние экрана или списка: иконка, заголовок, пояснение, действия. */
export function EmptyState({ icon, title, description, actions, className }: Props) {
	return (
		<div className={cn("flex flex-col items-center gap-3 px-4 py-10 text-center", className)}>
			{icon ? (
				<span
					aria-hidden="true"
					className="flex size-16 items-center justify-center rounded-full bg-accent-muted text-accent-strong [&_svg]:size-7"
				>
					{icon}
				</span>
			) : null}
			<div className="flex max-w-sm flex-col gap-1.5">
				<h2 className="text-[20px] leading-[26px] font-bold">{title}</h2>
				{description ? <p className="text-muted-foreground text-[15px] leading-[22px]">{description}</p> : null}
			</div>
			{actions ? <div className="mt-2 flex w-full max-w-sm flex-col gap-2">{actions}</div> : null}
		</div>
	);
}
