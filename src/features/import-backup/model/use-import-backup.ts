import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { parseDebtsBackup, restoreDebtsFromBackup } from "@/shared/lib/storage";
import { IMPORT_BACKUP_NS } from "../translations";
import { showImportBackupConfirm } from "../ui/ImportBackupConfirm";

function pickJsonFile(): Promise<File | null> {
	return new Promise((resolve) => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = "application/json,.json";
		input.onchange = () => resolve(input.files?.[0] ?? null);
		input.oncancel = () => resolve(null);
		input.click();
	});
}

/**
 * Импорт резервной копии: выбор файла → проверка формата → подтверждение со сводкой →
 * полная замена данных и перезагрузка. Используется в настройках и на пустой главной.
 */
export function useImportBackup() {
	const { t } = useTranslation(IMPORT_BACKUP_NS);
	const [busy, setBusy] = useState(false);

	const startImport = async () => {
		const file = await pickJsonFile();
		if (!file) return;
		let payload: ReturnType<typeof parseDebtsBackup>;
		try {
			payload = parseDebtsBackup(await file.text());
		} catch {
			toast.error(t("notBackup"));
			return;
		}
		void showImportBackupConfirm({
			payload,
			onConfirm: async () => {
				setBusy(true);
				try {
					await restoreDebtsFromBackup(payload);
					toast.success(t("success"));
					window.location.reload();
				} catch (e) {
					toast.error(t("failed", { message: e instanceof Error ? e.message : String(e) }));
				} finally {
					setBusy(false);
				}
			},
		});
	};

	return { startImport, busy, label: t("action") };
}
