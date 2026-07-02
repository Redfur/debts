import NiceModal, { useModal } from "@ebay/nice-modal-react";
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
import { cn } from "@/shared/lib/utils";

type ConfirmActionModalProps = {
	title: string;
	body: string;
	confirmLabel: string;
	cancelLabel: string;
	onConfirm: () => void | Promise<void>;
	confirmVariant?: "default" | "destructive";
};

const ConfirmActionModal = NiceModal.create(
	({ title, body, confirmLabel, cancelLabel, onConfirm, confirmVariant = "default" }: ConfirmActionModalProps) => {
		const modal = useModal();

		const closeModal = async () => {
			modal.resolve(true);
			await modal.hide();
			modal.remove();
		};

		const handleOpenChange = (open: boolean) => {
			if (open) return;
			void closeModal();
		};

		const handleConfirm = async () => {
			await onConfirm();
			await closeModal();
		};

		return (
			<AlertDialog open={modal.visible} onOpenChange={handleOpenChange}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{title}</AlertDialogTitle>
						<AlertDialogDescription>{body}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
						<AlertDialogAction
							className={cn(buttonVariants({ variant: confirmVariant }))}
							onClick={() => void handleConfirm()}
						>
							{confirmLabel}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		);
	},
);

export function showConfirmActionModal(props: ConfirmActionModalProps) {
	return NiceModal.show(ConfirmActionModal, props);
}
