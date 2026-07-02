/** Пресет цветов аватара-инициала контакта; выбор детерминирован по `id` при создании. */
export const CONTACT_COLOR_PRESET_HEX: readonly string[] = [
	"#ef4444",
	"#f97316",
	"#eab308",
	"#22c55e",
	"#14b8a6",
	"#3b82f6",
	"#8b5cf6",
	"#ec4899",
];

export function pickContactColor(seed: string): string {
	let hash = 0;
	for (let i = 0; i < seed.length; i++) {
		hash = (hash * 31 + seed.charCodeAt(i)) | 0;
	}
	const index = Math.abs(hash) % CONTACT_COLOR_PRESET_HEX.length;
	return CONTACT_COLOR_PRESET_HEX[index];
}
