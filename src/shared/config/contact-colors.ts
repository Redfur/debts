/**
 * Исходная палитра цвета аватара (hex сохраняется в контакте в IndexedDB и в резервных копиях).
 * Выбор детерминирован по имени при создании. Отрисовка берёт пару «фон / буква» из токенов
 * `avatar-1…8` по позиции hex в этой палитре — так формат данных не меняется.
 */
const CONTACT_COLOR_PRESET_HEX: readonly string[] = [
	"#ef4444",
	"#f97316",
	"#eab308",
	"#22c55e",
	"#14b8a6",
	"#3b82f6",
	"#8b5cf6",
	"#ec4899",
];

/** Нейтральная пара для hex вне палитры (например, из вручную отредактированной копии). */
const FALLBACK_AVATAR_INDEX = 6;

export function pickContactColor(seed: string): string {
	let hash = 0;
	for (let i = 0; i < seed.length; i++) {
		hash = (hash * 31 + seed.charCodeAt(i)) | 0;
	}
	const index = Math.abs(hash) % CONTACT_COLOR_PRESET_HEX.length;
	return CONTACT_COLOR_PRESET_HEX[index];
}

/** Номер пары токенов аватара (1…8) для сохранённого цвета контакта. */
export function avatarPaletteIndex(colorValue: string): number {
	const index = CONTACT_COLOR_PRESET_HEX.indexOf(colorValue.toLowerCase());
	return index === -1 ? FALLBACK_AVATAR_INDEX : index + 1;
}
