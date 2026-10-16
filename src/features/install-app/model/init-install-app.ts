import { isStandaloneDisplay } from "../lib/detect-platform";
import { initInstallState } from "./install-state";
import { requestPersistence } from "./storage-persistence";

/**
 * Инициализация до рендера: перехват событий установки и, в установленном приложении,
 * молчаливый запрос постоянного хранилища. Во вкладке не запрашиваем — Firefox показал бы свой диалог.
 */
export function initInstallApp(): void {
	initInstallState();
	if (isStandaloneDisplay()) void requestPersistence();
}
