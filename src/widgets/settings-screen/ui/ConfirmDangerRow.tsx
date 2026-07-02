import { Button } from "@/components/ui/button";
import { showConfirmActionModal } from "@/shared/ui/modals";

type Props = {
	triggerLabel: string;
	description: string;
	title: string;
	body: string;
	confirmLabel: string;
	cancelLabel: string;
	onConfirm: () => void | Promise<void>;
};

export function ConfirmDangerRow({
	triggerLabel,
	description,
	title,
	body,
	confirmLabel,
	cancelLabel,
	onConfirm,
}: Props) {
	const handleTriggerClick = () => {
		void showConfirmActionModal({
			title,
			body,
			confirmLabel,
			cancelLabel,
			onConfirm,
			confirmVariant: "destructive",
		});
	};

	return (
		<div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
			<div className="min-w-0 flex-1">
				<p className="text-sm font-medium">{triggerLabel}</p>
				<p className="text-muted-foreground mt-0.5 text-xs leading-snug">{description}</p>
			</div>
			<Button type="button" variant="destructive" className="shrink-0" onClick={handleTriggerClick}>
				{triggerLabel}
			</Button>
		</div>
	);
}
