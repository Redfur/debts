import { useState } from "react";
import { CLIENT_STATE_KEYS } from "@/shared/lib/client-storage-keys";

const KEY = CLIENT_STATE_KEYS.installBannerDismissed;

function readDismissed(): boolean {
	try {
		return localStorage.getItem(KEY) === "1";
	} catch {
		// Приватный режим может запрещать localStorage — тогда плашка считается незакрытой.
		return false;
	}
}

/** Плашка установки на главной: закрыли — больше не показываем на этом устройстве. */
export function useInstallBannerDismissal(): [dismissed: boolean, dismiss: () => void] {
	const [dismissed, setDismissed] = useState(readDismissed);
	const dismiss = () => {
		setDismissed(true);
		try {
			localStorage.setItem(KEY, "1");
		} catch {
			/* ignore */
		}
	};
	return [dismissed, dismiss];
}
