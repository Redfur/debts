import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { buildDebtsBackupFilename, createDebtsBackup, serializeDebtsBackup } from "@/shared/lib/storage";
import { EXPORT_BACKUP_NS } from "../translations";

/** Сохранение резервной копии в JSON-файл (локально, без сети) с тостом результата. */
export function useExportBackup() {
	const { t } = useTranslation(EXPORT_BACKUP_NS);
	const [busy, setBusy] = useState(false);

	const exportBackup = async () => {
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
			toast.success(t("success"));
		} catch (e) {
			toast.error(t("failed", { message: e instanceof Error ? e.message : String(e) }));
		} finally {
			setBusy(false);
		}
	};

	return { exportBackup, busy, label: t("action") };
}
