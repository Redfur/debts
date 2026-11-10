import type { NumberFormat } from "./localization-preference-state.ts";
import { NUMBER_FORMATS } from "./number-format.ts";

export function formatAmountInput(raw: string, format: NumberFormat): string {
	if (!raw) return "";
	const { group, decimal } = NUMBER_FORMATS[format];
	const [integer, fraction] = raw.split(".");
	return (integer || "0").replace(/\B(?=(\d{3})+(?!\d))/g, group) + (fraction === undefined ? "" : decimal + fraction);
}

export function parseAmountPaste(text: string, format: NumberFormat): string | null {
	const { group, decimal } = NUMBER_FORMATS[format];
	const input = text.trim();
	const parts = input.split(decimal);
	if (parts.length > 2 || (parts[1] !== undefined && !/^\d{0,2}$/.test(parts[1]))) return null;
	const integer = group === " " ? parts[0].replace(/[\u00a0\u202f]/g, " ") : parts[0];
	const groups = integer.split(group);
	if (!/^\d+$/.test(groups[0])) return null;
	if (groups.length > 1 && (groups[0].length > 3 || groups.slice(1).some((g) => !/^\d{3}$/.test(g)))) return null;
	return groups.join("").replace(/^0+(?=\d)/, "") + (parts[1] === undefined ? "" : `.${parts[1]}`);
}

/** Группировочные разделители не являются частью нормализованной строки. */
export function rawPosition(display: string, position: number, format: NumberFormat): number {
	const { group } = NUMBER_FORMATS[format];
	return [...display.slice(0, position)].filter((char) => char !== group).length;
}

export function displayPosition(display: string, rawOffset: number, format: NumberFormat): number {
	if (rawOffset === 0) return 0;
	for (let i = 1; i <= display.length; i++) if (rawPosition(display, i, format) === rawOffset) return i;
	return display.length;
}

export function editAmount(raw: string, start: number, end: number, text: string, deletion?: "backward" | "forward") {
	if (start === end && deletion === "backward") start = Math.max(0, start - 1);
	if (start === end && deletion === "forward") end = Math.min(raw.length, end + 1);
	const input = text.replaceAll(",", ".");
	const next = raw.slice(0, start) + input + raw.slice(end);
	if (!/^\d*(?:\.\d{0,2})?$/.test(next)) return null;
	const normalized = next.startsWith(".") ? `0${next}` : next.replace(/^0+(?=\d)/, "");
	return { value: normalized, cursor: Math.max(0, start + input.length + normalized.length - next.length) };
}
