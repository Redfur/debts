import { Copy, Download, Share } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { promptInstall } from "../model/install-state";
import { useInstallState } from "../model/use-install-state";
import { INSTALL_APP_NS } from "../translations";
import { showInstallInstructions } from "./InstallInstructionsSheet";
import { useCopyAppLink } from "./use-copy-app-link";

type Props = {
	onSaveBackup: () => void | Promise<void>;
	className?: string;
	iconClassName?: string;
};

/**
 * Способ установки для текущего браузера: «Установить» (системный диалог), «Как установить» (шторка)
 * или «Скопировать ссылку» (встроенный браузер). В установленном приложении не показывается.
 */
export function InstallActionButton({ onSaveBackup, className, iconClassName }: Props) {
	const { t } = useTranslation(INSTALL_APP_NS);
	const state = useInstallState();
	const copyAppLink = useCopyAppLink();

	if (state.mode === "installed") return null;

	const [Icon, label, onClick] =
		state.mode === "in-app"
			? [Copy, t("copyLink"), copyAppLink]
			: state.nativePromptAvailable
				? [Download, t("install"), promptInstall]
				: [Share, t("howTo"), () => showInstallInstructions({ onSaveBackup })];

	return (
		<Button type="button" variant="secondary" className={cn("gap-2", className)} onClick={() => void onClick()}>
			<Icon className={cn("text-accent size-[18px]", iconClassName)} aria-hidden="true" />
			{label}
		</Button>
	);
}
