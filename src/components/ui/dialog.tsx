import { XIcon } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import * as React from "react";
import { cn } from "@/shared/lib/utils";

/**
 * Модальное окно по дизайн-системе: на ширине < 1024 px — шторка снизу (радиус 28 сверху, ручка 36×5,
 * отступ под системную полосу), на десктопе — диалог по центру. Общие классы переиспользует `alert-dialog`.
 */
export const modalOverlayClass =
	"fixed inset-0 z-50 bg-scrim data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0";

export const modalContentClass = cn(
	"fixed z-50 flex flex-col gap-4 bg-card text-card-foreground outline-none",
	// Шторка (мобильный)
	"inset-x-0 bottom-0 max-h-[92svh] overflow-y-auto rounded-t-sheet px-4 pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+16px)]",
	"data-open:animate-in data-open:slide-in-from-bottom data-closed:animate-out data-closed:slide-out-to-bottom duration-200",
	// Диалог (десктоп)
	"lg:inset-x-auto lg:bottom-auto lg:top-1/2 lg:left-1/2 lg:w-full lg:max-w-md lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-card lg:p-6 lg:shadow-raised",
	"lg:data-open:slide-in-from-bottom-0 lg:data-open:zoom-in-95 lg:data-open:fade-in-0 lg:data-closed:slide-out-to-bottom-0 lg:data-closed:zoom-out-95 lg:data-closed:fade-out-0",
);

/** Ручка шторки — только на мобильном. */
export function ModalHandle() {
	return (
		<span aria-hidden="true" className="mx-auto h-[5px] w-9 shrink-0 rounded-full bg-muted-foreground/30 lg:hidden" />
	);
}

function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
	return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
	return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
	return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
	return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
	return <DialogPrimitive.Overlay data-slot="dialog-overlay" className={cn(modalOverlayClass, className)} {...props} />;
}

function DialogContent({
	className,
	children,
	showCloseButton = false,
	onPointerDownOutside,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { showCloseButton?: boolean }) {
	const contentRef = React.useRef<HTMLDivElement>(null);

	return (
		<DialogPortal>
			<DialogOverlay />
			<DialogPrimitive.Content
				ref={contentRef}
				data-slot="dialog-content"
				// Пока внутри диалога открыт вложенный слой (Select, Combobox, DropdownMenu и т.п.),
				// Radix временно отключает pointer-events у DialogContent — клик по полю диалога
				// физически попадает на элемент позади (например Overlay) и распознаётся как клик
				// "вне" диалога, закрывая его вместе с вложенным слоем. Проверяем координаты клика:
				// если они физически внутри рамки диалога — это не клик наружу, игнорируем его.
				onPointerDownOutside={(event) => {
					const original = event.detail.originalEvent;
					const rect = contentRef.current?.getBoundingClientRect();
					if (
						rect &&
						original.clientX >= rect.left &&
						original.clientX <= rect.right &&
						original.clientY >= rect.top &&
						original.clientY <= rect.bottom
					) {
						event.preventDefault();
						return;
					}
					onPointerDownOutside?.(event);
				}}
				className={cn(modalContentClass, className)}
				{...props}
			>
				<ModalHandle />
				{children}
				{showCloseButton ? (
					<DialogPrimitive.Close
						data-slot="dialog-close"
						className="ring-offset-background focus:ring-ring touch-target absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
					>
						<XIcon />
						<span className="sr-only">Закрыть</span>
					</DialogPrimitive.Close>
				) : null}
			</DialogPrimitive.Content>
		</DialogPortal>
	);
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
	return <div data-slot="dialog-header" className={cn("flex flex-col gap-1", className)} {...props} />;
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
	return <div data-slot="dialog-footer" className={cn("mt-1 flex gap-2 *:flex-1", className)} {...props} />;
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
	return (
		<DialogPrimitive.Title
			data-slot="dialog-title"
			className={cn("text-[20px] leading-[26px] font-bold", className)}
			{...props}
		/>
	);
}

function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
	return (
		<DialogPrimitive.Description
			data-slot="dialog-description"
			className={cn("text-muted-foreground text-body-s", className)}
			{...props}
		/>
	);
}

export {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
	DialogTrigger,
};
