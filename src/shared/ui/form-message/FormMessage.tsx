import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

/** Ошибка под полем: иконка и текст 13 px; поле ссылается на неё через `aria-describedby`. */
export function FieldError({ id, children, className }: { id: string; children: ReactNode; className?: string }) {
	return (
		<span id={id} className={cn("text-caption text-destructive flex items-center gap-1.5 pl-1 font-medium", className)}>
			<CircleAlert className="size-4 shrink-0" aria-hidden="true" />
			{children}
		</span>
	);
}

/** Общая ошибка формы над кнопкой отправки («Не удалось сохранить…»). */
export function FormAlert({ children, className }: { children: ReactNode; className?: string }) {
	return (
		<div
			role="alert"
			className={cn(
				"bg-destructive-muted text-destructive-strong text-body-s flex items-center gap-2.5 rounded-[16px] px-3.5 py-3 font-medium",
				className,
			)}
		>
			<CircleAlert className="size-5 shrink-0" aria-hidden="true" />
			{children}
		</div>
	);
}
