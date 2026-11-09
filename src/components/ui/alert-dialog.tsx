import { AlertDialog as RadixAlert } from "radix-ui";
import * as React from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { AdaptiveModal, type AdaptiveModalProps, useAdaptiveModal, useRadixCloseComplete } from "./adaptive-modal";
import { modalContentClass, modalOverlayClass } from "./dialog";
import { Drawer, DrawerContent } from "./drawer";

function AlertDialog(props: AdaptiveModalProps) {
	return <AdaptiveModal alert {...props} />;
}
function AlertDialogContent({
	className,
	children,
	onEscapeKeyDown,
	onCloseAutoFocus,
	...props
}: React.ComponentProps<typeof RadixAlert.Content>) {
	const { mobile, dismissible, returnFocus } = useAdaptiveModal();
	const ref = useRadixCloseComplete();
	const cancelRef = React.useRef<HTMLButtonElement>(null);
	if (mobile)
		return (
			<DrawerContent
				{...props}
				role="alertdialog"
				data-modal-backend="drawer"
				dismissible={dismissible}
				initialFocus={cancelRef}
				finalFocus={returnFocus}
				className={cn("items-center text-center", className)}
			>
				<CancelFocusContext.Provider value={cancelRef}>{children}</CancelFocusContext.Provider>
			</DrawerContent>
		);
	return (
		<RadixAlert.Portal>
			<RadixAlert.Overlay className={modalOverlayClass} />
			<RadixAlert.Content
				{...props}
				ref={ref}
				data-modal-backend="radix"
				className={cn(modalContentClass, "items-center text-center", className)}
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
			>
				{children}
			</RadixAlert.Content>
		</RadixAlert.Portal>
	);
}
const CancelFocusContext = React.createContext<React.RefObject<HTMLButtonElement | null> | undefined>(undefined);
function AlertDialogHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="alert-dialog-header"
			className={cn("flex shrink-0 flex-col items-center gap-1.5 px-2", className)}
			{...props}
		/>
	);
}
function AlertDialogFooter({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="alert-dialog-footer"
			className={cn("mt-1 flex w-full shrink-0 flex-col gap-2", className)}
			{...props}
		/>
	);
}
function AlertDialogTitle({ className, ...props }: React.ComponentProps<typeof RadixAlert.Title>) {
	const { mobile } = useAdaptiveModal();
	const Component = mobile ? Drawer.Title : RadixAlert.Title;
	return (
		<Component
			data-slot="alert-dialog-title"
			className={cn("text-[20px] leading-[26px] font-bold", className)}
			{...props}
		/>
	);
}
function AlertDialogDescription({ className, ...props }: React.ComponentProps<typeof RadixAlert.Description>) {
	const { mobile } = useAdaptiveModal();
	const Component = mobile ? Drawer.Description : RadixAlert.Description;
	return (
		<Component
			data-slot="alert-dialog-description"
			className={cn("text-muted-foreground text-[15px] leading-[22px]", className)}
			{...props}
		/>
	);
}
function AlertDialogAction({ className, onClick, ...props }: React.ComponentProps<typeof RadixAlert.Action>) {
	const { mobile } = useAdaptiveModal();
	const classes = cn(buttonVariants({ size: "lg" }), "w-full", className);
	if (mobile)
		return (
			<Drawer.Close
				className={classes}
				{...props}
				onClick={(event) => {
					onClick?.(event);
					// Сохраняем контракт Radix: preventDefault отменяет автоматическое закрытие action.
					if (event.defaultPrevented) event.preventBaseUIHandler();
				}}
			/>
		);
	return <RadixAlert.Action className={classes} onClick={onClick} {...props} />;
}
function AlertDialogCancel({ className, disabled, ...props }: React.ComponentProps<typeof RadixAlert.Cancel>) {
	const { mobile, dismissible } = useAdaptiveModal();
	const ref = React.useContext(CancelFocusContext);
	const classes = cn(buttonVariants({ variant: "secondary", size: "lg" }), "w-full font-medium", className);
	if (mobile)
		return (
			<Drawer.Close
				ref={ref}
				data-slot="alert-dialog-cancel"
				disabled={disabled || !dismissible}
				className={classes}
				{...props}
			/>
		);
	return (
		<RadixAlert.Cancel
			data-slot="alert-dialog-cancel"
			disabled={disabled || !dismissible}
			className={classes}
			{...props}
		/>
	);
}

export {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
};
