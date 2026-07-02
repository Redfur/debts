/** Ошибка загрузки динамического чанка после деплоя (старый main, новые хэши на CDN). */
export function isChunkLoadError(error: unknown): boolean {
	if (!(error instanceof Error)) {
		return false;
	}
	const { name, message } = error;
	if (name === "ChunkLoadError") {
		return true;
	}
	const m = message.toLowerCase();
	return (
		m.includes("failed to fetch dynamically imported module") ||
		m.includes("loading chunk") ||
		m.includes("importing a module script failed")
	);
}
