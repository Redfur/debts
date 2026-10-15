import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { Trash2 } from "lucide-react";
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
					{confirmVariant === "destructive" ? <ConfirmIcon /> : null}
					<AlertDialogHeader>
						<AlertDialogTitle>{title}</AlertDialogTitle>
						{lead ? <p className="text-foreground text-[15px] leading-[22px]">{lead}</p> : null}
						<AlertDialogDescription>{body}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogAction
							className={cn(buttonVariants({ variant: confirmVariant, size: "lg" }), "w-full")}
							onClick={() => void handleConfirm()}
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
