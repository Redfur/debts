import { XIcon } from "lucide-react";
import { Dialog as RadixDialog } from "radix-ui";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { COMMON_NS } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { AdaptiveModal, type AdaptiveModalProps, useAdaptiveModal, useRadixCloseComplete } from "./adaptive-modal";
import { Drawer, DrawerContent } from "./drawer";

export const modalOverlayClass =
	"fixed inset-0 z-50 bg-scrim data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 motion-reduce:animate-none";
export const modalContentClass =
	"fixed top-1/2 left-1/2 z-50 flex max-h-[92dvh] w-full max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-card bg-card p-6 text-card-foreground shadow-raised outline-none duration-200 data-open:animate-in data-open:zoom-in-95 data-open:fade-in-0 data-closed:animate-out data-closed:zoom-out-95 data-closed:fade-out-0 motion-reduce:animate-none";

function Dialog(props: AdaptiveModalProps) {
	return <AdaptiveModal {...props} />;
}

function DialogTrigger({ asChild, children, ...props }: React.ComponentProps<typeof RadixDialog.Trigger>) {
	const { mobile } = useAdaptiveModal();
	if (mobile)
		return (
			<Drawer.Trigger
				data-slot="dialog-trigger"
				render={asChild && React.isValidElement(children) ? children : undefined}
				{...props}
			>
				{asChild ? undefined : children}
			</Drawer.Trigger>
		);
	return (
		<RadixDialog.Trigger data-slot="dialog-trigger" asChild={asChild} {...props}>
			{children}
		</RadixDialog.Trigger>
	);
}

function DialogClose({ asChild, children, disabled, ...props }: React.ComponentProps<typeof RadixDialog.Close>) {
	const { mobile, dismissible } = useAdaptiveModal();
	if (mobile)
		return (
			<Drawer.Close
				data-slot="dialog-close"
				disabled={disabled || !dismissible}
				render={asChild && React.isValidElement(children) ? children : undefined}
				{...props}
			>
				{asChild ? undefined : children}
			</Drawer.Close>
		);
	return (
		<RadixDialog.Close data-slot="dialog-close" asChild={asChild} disabled={disabled || !dismissible} {...props}>
			{children}
		</RadixDialog.Close>
	);
}

function DialogContent({
	className,
	children,
	showCloseButton = false,
	onPointerDownOutside,
	onEscapeKeyDown,
	onOpenAutoFocus,
	onCloseAutoFocus,
	...props
}: React.ComponentProps<typeof RadixDialog.Content> & { showCloseButton?: boolean }) {
	const { mobile, dismissible, returnFocus } = useAdaptiveModal();
	const ref = useRadixCloseComplete();
	const { t } = useTranslation(COMMON_NS);
	const contents = (
		<>
			{children}
			{showCloseButton && (
				<DialogClose
					className={cn(
						"touch-target absolute right-4 rounded-full bg-secondary p-2 outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
						mobile ? "top-11" : "top-4",
					)}
				>
					<XIcon className="size-5" />
					<span className="sr-only">{t("close")}</span>
				</DialogClose>
			)}
		</>
	);
	if (mobile)
		return (
			<DrawerContent
				role="dialog"
				finalFocus={returnFocus}
				data-modal-backend="drawer"
				dismissible={dismissible}
				className={className}
				{...props}
			>
				{contents}
			</DrawerContent>
		);
	return (
		<RadixDialog.Portal>
			<RadixDialog.Overlay className={modalOverlayClass} />
			<RadixDialog.Content
				{...props}
				ref={ref}
				data-slot="dialog-content"
				data-modal-backend="radix"
				className={cn(modalContentClass, className)}
				onOpenAutoFocus={onOpenAutoFocus}
				onCloseAutoFocus={(event) => {
					onCloseAutoFocus?.(event);
					if (event.defaultPrevented) return;
					const target = returnFocus();
					if (target !== true) {
						event.preventDefault();
						target.focus({ preventScroll: true });
					}
				}}
				onEscapeKeyDown={(event) => {
					if (!dismissible) event.preventDefault();
					onEscapeKeyDown?.(event);
				}}
				onPointerDownOutside={(event) => {
					const original = event.detail.originalEvent;
					const rect = ref.current?.getBoundingClientRect();
					if (
						!dismissible ||
						(rect &&
							original.clientX >= rect.left &&
							original.clientX <= rect.right &&
							original.clientY >= rect.top &&
							original.clientY <= rect.bottom)
					)
						event.preventDefault();
					else onPointerDownOutside?.(event);
				}}
			>
				{contents}
			</RadixDialog.Content>
		</RadixDialog.Portal>
	);
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
	return <div data-slot="dialog-header" className={cn("flex shrink-0 flex-col gap-1", className)} {...props} />;
}
function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
	return <div data-slot="dialog-footer" className={cn("mt-1 flex shrink-0 gap-2 *:flex-1", className)} {...props} />;
}
function DialogTitle({ className, ...props }: React.ComponentProps<typeof RadixDialog.Title>) {
	const { mobile } = useAdaptiveModal();
	const Component = mobile ? Drawer.Title : RadixDialog.Title;
	return (
		<Component
			data-slot="dialog-title"
			className={cn("shrink-0 text-[20px] leading-[26px] font-bold", className)}
			{...props}
		/>
	);
}
function DialogDescription({ className, ...props }: React.ComponentProps<typeof RadixDialog.Description>) {
	const { mobile } = useAdaptiveModal();
	const Component = mobile ? Drawer.Description : RadixDialog.Description;
	return (
		<Component
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
	DialogTitle,
	DialogTrigger,
};
