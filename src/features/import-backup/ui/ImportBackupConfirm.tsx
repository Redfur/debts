import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { COMMON_NS } from "@/shared/i18n";
import { formatDateTimeWithYear } from "@/shared/lib/format-date";
import type { DebtsBackupPayload } from "@/shared/lib/storage";
import { useModalClose } from "@/shared/lib/use-modal-close";
import { cn } from "@/shared/lib/utils";
import { IMPORT_BACKUP_NS } from "../translations";

type Props = {
	payload: DebtsBackupPayload;
	onConfirm: () => Promise<void>;
};

/** Подтверждение импорта: сводка копии и полная замена данных. */
const ImportBackupConfirm = NiceModal.create(({ payload, onConfirm }: Props) => {
	const { t } = useTranslation(IMPORT_BACKUP_NS);
	const { t: tCommon } = useTranslation(COMMON_NS);
	const modal = useModal();
	const [busy, setBusy] = useState(false);
	const running = useRef(false);

	const { close, onCloseComplete } = useModalClose(modal);

	const rows: [string, string][] = [
		[t("contacts"), String(payload.contacts.length)],
		[t("debts"), String(payload.debts.length)],
		[t("bills"), String(payload.bills.length)],
		[t("createdAt"), formatDateTimeWithYear(payload.exportedAt)],
	];

	return (
		<AlertDialog
			open={modal.visible}
			onCloseComplete={onCloseComplete}
			dismissible={!busy}
			onOpenChange={(open) => !open && void close()}
		>
			<AlertDialogContent>
				<div className="flex min-h-0 w-full flex-col items-center gap-4 overflow-y-auto overscroll-contain">
					<span
						aria-hidden="true"
						className="bg-accent-muted text-accent-strong mt-1.5 flex size-14 items-center justify-center rounded-full"
					>
						<Upload className="size-[26px]" />
					</span>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("confirmTitle")}</AlertDialogTitle>
					</AlertDialogHeader>
					<dl className="bg-secondary w-full rounded-control px-4 py-1 text-left">
						{rows.map(([label, value]) => (
							<div key={label} className="flex min-h-11 items-center justify-between gap-3 not-last:border-b">
								<dt className="text-muted-foreground text-[15px]">{label}</dt>
								<dd className="text-[15px] font-semibold">{value}</dd>
							</div>
						))}
					</dl>
					<AlertDialogDescription className="text-sm">{t("confirmBody")}</AlertDialogDescription>
				</div>
				<AlertDialogFooter>
					<AlertDialogAction
						disabled={busy}
						className={cn(buttonVariants({ variant: "destructive", size: "lg" }), "w-full")}
						onClick={async (e) => {
							e.preventDefault();
							if (running.current) return;
							running.current = true;
							setBusy(true);
							try {
								await onConfirm();
								void close();
							} finally {
								running.current = false;
								setBusy(false);
							}
						}}
					>
						{t("confirmAction")}
					</AlertDialogAction>
					<AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
});

export function showImportBackupConfirm(props: Props) {
	return NiceModal.show(ImportBackupConfirm, props);
}
