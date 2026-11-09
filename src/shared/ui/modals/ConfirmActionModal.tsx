import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { useModalClose } from "@/shared/lib/use-modal-close";
import { cn } from "@/shared/lib/utils";

type ConfirmActionModalProps = {
	title: string;
	/** Строка над описанием основным цветом (например, почему удалится больше, чем ожидается). */
	lead?: string;
	body: string;
	confirmLabel: string;
	cancelLabel: string;
	onConfirm: () => void | Promise<void>;
	confirmVariant?: "default" | "destructive";
};

/** Иконка в круге над заголовком; для необратимых действий — корзина на красной подложке. */
function ConfirmIcon() {
	return (
		<span
			aria-hidden="true"
			className="bg-destructive-muted text-destructive mt-1.5 flex size-14 items-center justify-center rounded-full"
		>
			<Trash2 className="size-[26px]" />
		</span>
	);
}

const ConfirmActionModal = NiceModal.create(
	({
		title,
		lead,
		body,
		confirmLabel,
		cancelLabel,
		onConfirm,
		confirmVariant = "default",
	}: ConfirmActionModalProps) => {
		const modal = useModal();
		const [busy, setBusy] = useState(false);
		const running = useRef(false);

		const { close, onCloseComplete } = useModalClose(modal);
		const closeModal = async () => {
			modal.resolve(true);
			await close();
		};

		const handleOpenChange = (open: boolean) => {
			if (open) return;
			void closeModal();
		};

		const handleConfirm = async () => {
			if (running.current) return;
			running.current = true;
			setBusy(true);
			try {
				await onConfirm();
				void closeModal();
			} finally {
				running.current = false;
				setBusy(false);
			}
		};

		return (
			<AlertDialog
				open={modal.visible}
				onCloseComplete={onCloseComplete}
				dismissible={!busy}
				onOpenChange={handleOpenChange}
			>
				<AlertDialogContent>
					<div className="flex min-h-0 w-full flex-col items-center gap-4 overflow-y-auto overscroll-contain">
						{confirmVariant === "destructive" ? <ConfirmIcon /> : null}
						<AlertDialogHeader>
							<AlertDialogTitle>{title}</AlertDialogTitle>
							{lead ? <p className="text-foreground text-[15px] leading-[22px]">{lead}</p> : null}
							<AlertDialogDescription>{body}</AlertDialogDescription>
						</AlertDialogHeader>
					</div>
					<AlertDialogFooter>
						<AlertDialogAction
							className={cn(buttonVariants({ variant: confirmVariant, size: "lg" }), "w-full")}
							disabled={busy}
							onClick={(event) => {
								event.preventDefault();
								void handleConfirm();
							}}
						>
							{confirmLabel}
						</AlertDialogAction>
						<AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		);
	},
);

export function showConfirmActionModal(props: ConfirmActionModalProps) {
	return NiceModal.show(ConfirmActionModal, props);
}
