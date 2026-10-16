import { useCallback, useEffect, useState } from "react";

/** `unsupported` — браузер не сообщает, защищены ли данные; строку в настройках тогда не показываем. */
export type StoragePersistence = "unknown" | "unsupported" | "persisted" | "at-risk";

function storageManager(): StorageManager | null {
	if (typeof navigator === "undefined") return null;
	const storage = navigator.storage;
	if (typeof storage?.persisted !== "function" || typeof storage.persist !== "function") return null;
	return storage;
}

async function readPersistence(): Promise<StoragePersistence> {
	const storage = storageManager();
	if (!storage) return "unsupported";
	try {
		return (await storage.persisted()) ? "persisted" : "at-risk";
	} catch {
		return "unsupported";
	}
}

/** Просит браузер защитить данные от автоочистки; `true`, если защита есть. */
export async function requestPersistence(): Promise<boolean> {
	const storage = storageManager();
	if (!storage) return false;
	try {
		return (await storage.persisted()) || (await storage.persist());
	} catch {
		return false;
	}
}

export function useStoragePersistence() {
	const [status, setStatus] = useState<StoragePersistence>("unknown");

	const refresh = useCallback(async () => {
		setStatus(await readPersistence());
	}, []);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	const protect = async (): Promise<boolean> => {
		const granted = await requestPersistence();
		await refresh();
		return granted;
	};

	return { status, protect };
}
