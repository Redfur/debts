import { TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useDebtStore } from "@/entities/debt";
import { COMMON_NS } from "@/shared/i18n";

/** Баннер ошибки хранилища — под заголовком экрана (через `PageHeaderAfterSlot`). */
export function StorageErrorBanner() {
	const { t } = useTranslation(COMMON_NS);
	const lastError = useDebtStore((s) => s.lastError);
	const clearError = useDebtStore((s) => s.clearError);

	if (!lastError) return null;

	return (
		<div
			role="alert"
			className="bg-destructive-muted text-destructive-strong mt-2 flex items-center gap-3 rounded-[16px] py-2 pr-2 pl-3.5 text-sm font-medium"
		>
			<TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
			<span className="min-w-0 flex-1">{t("storageError", { message: lastError })}</span>
			<Button type="button" size="sm" variant="secondary" className="bg-card" onClick={() => clearError()}>
				{t("ok")}
			</Button>
		</div>
	);
}
