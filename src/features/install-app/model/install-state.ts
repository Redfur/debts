import { toast } from "sonner";
import { i18n } from "@/shared/lib/i18n";
import {
	detectInstallMode,
	detectInstallPlatform,
	type InstallMode,
	type InstallPlatform,
	isStandaloneDisplay,
	subscribeToDisplayModeChange,
} from "../lib/detect-platform";
import { INSTALL_APP_NS } from "../translations";

/** Событие системного диалога установки (Chromium); в стандартных типах DOM его нет. */
interface BeforeInstallPromptEvent extends Event {
	prompt(): Promise<void>;
	readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type InstallState = {
	mode: InstallMode;
	platform: InstallPlatform;
	/** Браузер прислал `beforeinstallprompt`, и кнопка «Установить» откроет системный диалог. */
	nativePromptAvailable: boolean;
	/** Приложение установили из этой вкладки через системный диалог. */
	installedNow: boolean;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let state: InstallState = readState(false);
const listeners = new Set<() => void>();

function readState(installedNow: boolean): InstallState {
	const userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent;
	const maxTouchPoints = typeof navigator === "undefined" ? 0 : navigator.maxTouchPoints;
	return {
		mode: detectInstallMode(isStandaloneDisplay(), userAgent),
		platform: detectInstallPlatform(userAgent, maxTouchPoints),
		nativePromptAvailable: deferredPrompt !== null,
		installedNow,
	};
}

function update(installedNow = state.installedNow) {
	state = readState(installedNow);
	for (const listener of listeners) listener();
}

export function subscribeInstallState(listener: () => void): () => void {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

export function getInstallState(): InstallState {
	return state;
}

/**
 * Подписывается на события установки. Вызывается до рендера: `beforeinstallprompt` приходит рано,
 * и без раннего перехвата кнопка «Установить» не появится до следующего визита.
 */
export function initInstallState(): void {
	if (typeof window === "undefined") return;
	window.addEventListener("beforeinstallprompt", (event) => {
		event.preventDefault();
		deferredPrompt = event as BeforeInstallPromptEvent;
		update();
	});
	window.addEventListener("appinstalled", () => {
		deferredPrompt = null;
		update(true);
		toast.success(i18n.t("installedToast", { ns: INSTALL_APP_NS }), {
			description: i18n.t("installedToastText", { ns: INSTALL_APP_NS }),
		});
	});
	subscribeToDisplayModeChange(() => update());
	update();
}

/** Открывает системный диалог установки. Событие одноразовое: после ответа ждём, пришлёт ли браузер новое. */
export async function promptInstall(): Promise<void> {
	const prompt = deferredPrompt;
	if (!prompt) return;
	deferredPrompt = null;
	try {
		await prompt.prompt();
		await prompt.userChoice;
	} catch {
		// Браузер отказал в показе диалога — кнопка переходит в «Как установить».
	} finally {
		update();
	}
}
