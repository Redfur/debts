import { Download } from "lucide-react";
import { type ChangeEvent, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { COMMON_NS } from "@/shared/i18n";
import {
	buildDebtsBackupFilename,
	createDebtsBackup,
	type DebtsBackupPayload,
	parseDebtsBackup,
	restoreDebtsFromBackup,
	serializeDebtsBackup,
} from "@/shared/lib/storage";
import { showConfirmActionModal } from "@/shared/ui/modals";
import { SETTINGS_SCREEN_NS } from "../translations";

function errorMessage(e: unknown): string {
	return e instanceof Error ? e.message : String(e);
}

export function BackupActionsCard() {
	const { t } = useTranslation(SETTINGS_SCREEN_NS);
	const { t: tCommon } = useTranslation(COMMON_NS);
	const [busy, setBusy] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleExport = async () => {
		setBusy(true);
		try {
			const payload = await createDebtsBackup();
			const blob = new Blob([serializeDebtsBackup(payload)], { type: "application/json" });
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = buildDebtsBackupFilename(new Date());
			link.click();
			URL.revokeObjectURL(url);
			toast.success(t("backupExportSuccess"));
		} catch (e) {
			toast.error(t("backupExportFailed", { message: errorMessage(e) }));
		} finally {
			setBusy(false);
		}
	};

	const runImport = async (payload: DebtsBackupPayload) => {
		setBusy(true);
		try {
			await restoreDebtsFromBackup(payload);
			toast.success(t("backupImportSuccess"));
			window.location.reload();
		} catch (e) {
			toast.error(t("backupImportFailed", { message: errorMessage(e) }));
		} finally {
			setBusy(false);
		}
	};

	const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		e.target.value = "";
		if (!file) return;
		try {
			const raw = await file.text();
			const payload = parseDebtsBackup(raw);
			void showConfirmActionModal({
				title: t("backupImportDialogTitle"),
				body: t("backupImportDialogBody", {
					contacts: payload.contacts.length,
					debts: payload.debts.length,
					date: payload.exportedAt,
				}),
				confirmLabel: t("backupImportConfirmAction"),
				cancelLabel: tCommon("cancel"),
				confirmVariant: "destructive",
				onConfirm: () => runImport(payload),
			});
		} catch (err) {
			toast.error(errorMessage(err));
		}
	};

	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-sm font-medium">{t("backupSection")}</CardTitle>
				<CardDescription className="text-xs">{t("backupHint")}</CardDescription>
			</CardHeader>
			<CardContent className="flex gap-2">
				<Button type="button" variant="outline" size="sm" onClick={() => void handleExport()} disabled={busy}>
					<Download />
					{t("backupExport")}
				</Button>
				<Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={busy}>
					{t("backupImport")}
				</Button>
				<input
					ref={fileInputRef}
					type="file"
					accept="application/json"
					className="hidden"
					onChange={(e) => void handleFileChange(e)}
				/>
			</CardContent>
		</Card>
	);
}
