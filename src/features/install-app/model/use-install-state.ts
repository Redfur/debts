import { useSyncExternalStore } from "react";
import { useDebtStore } from "@/entities/debt";
import { getInstallState, type InstallState, subscribeInstallState } from "./install-state";

export function useInstallState(): InstallState {
	return useSyncExternalStore(subscribeInstallState, getInstallState, getInstallState);
}

/** Есть хотя бы один долг или счёт — тогда на iOS и во встроенном браузере нужен перенос данных. */
export function useHasRecords(): boolean {
	return useDebtStore((s) => Object.keys(s.debtsById).length > 0 || Object.keys(s.billsById).length > 0);
}

/** Записи при установке не переедут сами: у приложения на iOS своё хранилище, встроенный браузер — тоже чужое. */
export function needsDataMove(state: InstallState): boolean {
	return state.platform === "ios" || state.mode === "in-app";
}

/** Приглашать к установке: открыто не как приложение и его не поставили только что. */
export function shouldInviteToInstall(state: InstallState): boolean {
	return state.mode !== "installed" && !state.installedNow;
}

/** Показывается ли приглашение установить — пустая главная под него ужимает приветствие на телефоне. */
export function useInstallInvitation(): boolean {
	return shouldInviteToInstall(useInstallState());
}
