import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { INSTALL_APP_NS } from "../translations";

/** Адрес приложения, а не текущего экрана: открыть в браузере нужно с главной. */
export function appUrl(): string {
	return new URL(import.meta.env.BASE_URL, window.location.origin).href;
}

/** «Скопировать ссылку»: тост об успехе или, если буфер недоступен, адрес в тосте для ручного выделения. */
export function useCopyAppLink() {
	const { t } = useTranslation(INSTALL_APP_NS);

	return async () => {
		const url = appUrl();
		try {
			if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
			await navigator.clipboard.writeText(url);
			toast.success(t("linkCopied"));
		} catch {
			toast.error(t("linkCopyFailed"), {
				duration: 8000,
				description: (
					<span className="flex flex-col gap-0.5">
						<span className="text-background font-medium break-all select-all">{url}</span>
						<span>{t("linkCopyHint")}</span>
					</span>
				),
			});
		}
	};
}
