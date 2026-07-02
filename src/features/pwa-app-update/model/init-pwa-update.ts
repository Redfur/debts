import { registerSW } from "virtual:pwa-register";
import { toast } from "sonner";
import { PWA_APP_UPDATE_NS } from "@/features/pwa-app-update/translations";
import { i18n } from "@/shared/lib/i18n";

export function initPwaUpdate(): void {
	const updateSW = registerSW({
		onNeedRefresh() {
			const version = import.meta.env.VITE_APP_VERSION;
			toast.message(i18n.t("title", { ns: PWA_APP_UPDATE_NS }), {
				...(version
					? {
							description: i18n.t("versionLine", {
								ns: PWA_APP_UPDATE_NS,
								version: String(version),
							}),
						}
					: {}),
				duration: Number.POSITIVE_INFINITY,
				action: {
					label: i18n.t("reload", { ns: PWA_APP_UPDATE_NS }),
					onClick: () => {
						void updateSW(true);
					},
				},
				cancel: {
					label: i18n.t("later", { ns: PWA_APP_UPDATE_NS }),
					onClick: () => {},
				},
			});
		},
	});
}
