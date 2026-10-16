/** Где открыто приложение: установлено, во встроенном браузере другого приложения или в обычном браузере. */
export type InstallMode = "installed" | "in-app" | "browser";

/** Платформа для инструкции по установке: у iOS / iPadOS свои шаги и отдельное хранилище приложения. */
export type InstallPlatform = "ios" | "other";

const STANDALONE_QUERIES = [
	"(display-mode: standalone)",
	"(display-mode: fullscreen)",
	"(display-mode: minimal-ui)",
	"(display-mode: window-controls-overlay)",
];

/**
 * Встроенные браузеры мессенджеров и соцсетей, откуда PWA не установить.
 * Android WebView помечен «; wv)»; встроенные браузеры iOS (SFSafariViewController) от Safari не отличить.
 */
const IN_APP_BROWSER_RE = /Telegram|Instagram|FBAN|FBAV|FB_IAB|VKClient|vkontakte|\bLine\/|; wv\)/i;

export function isStandaloneDisplay(): boolean {
	if (typeof window === "undefined") return false;
	if (STANDALONE_QUERIES.some((query) => window.matchMedia?.(query).matches)) return true;
	// iOS до поддержки display-mode в манифесте сообщает режим «с экрана Домой» только так.
	return "standalone" in navigator && navigator.standalone === true;
}

function isIosDevice(userAgent: string, maxTouchPoints: number): boolean {
	if (/iPhone|iPad|iPod/.test(userAgent)) return true;
	// iPadOS по умолчанию представляется как Mac; отличает его сенсорный экран.
	return /Macintosh/.test(userAgent) && maxTouchPoints > 1;
}

function isInAppBrowser(userAgent: string): boolean {
	return IN_APP_BROWSER_RE.test(userAgent);
}

export function detectInstallMode(standalone: boolean, userAgent: string): InstallMode {
	if (standalone) return "installed";
	if (isInAppBrowser(userAgent)) return "in-app";
	return "browser";
}

export function detectInstallPlatform(userAgent: string, maxTouchPoints: number): InstallPlatform {
	return isIosDevice(userAgent, maxTouchPoints) ? "ios" : "other";
}

export function subscribeToDisplayModeChange(onChange: () => void): () => void {
	if (typeof window === "undefined" || !window.matchMedia) return () => {};
	const lists = STANDALONE_QUERIES.map((query) => window.matchMedia(query));
	for (const list of lists) list.addEventListener("change", onChange);
	return () => {
		for (const list of lists) list.removeEventListener("change", onChange);
	};
}
