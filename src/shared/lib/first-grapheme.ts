/**
 * Первая графема строки (для буквы-заглушки у типа упражнения).
 */
export function firstGrapheme(text: string): string {
	const t = text.trim();
	if (!t) return "";
	try {
		const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
		const it = seg.segment(t)[Symbol.iterator]();
		const first = it.next();
		return first.done ? "" : first.value.segment;
	} catch {
		return [...t][0] ?? "";
	}
}
