import type { NumberFormat } from "./localization-preference-state.ts";

export const NUMBER_FORMATS = {
	"space-comma": { group: " ", decimal: ",", example: "1 234,56" },
	"space-dot": { group: " ", decimal: ".", example: "1 234.56" },
	"comma-dot": { group: ",", decimal: ".", example: "1,234.56" },
	"dot-comma": { group: ".", decimal: ",", example: "1.234,56" },
} as const;

const formatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2, useGrouping: false });

/** Чистое форматирование: одна денежная точность для всех валют. */
export function formatNumber(value: number, format: NumberFormat): string {
	const { group, decimal } = NUMBER_FORMATS[format];
	const [integer, fraction] = formatter.format(value).split(".");
	return integer.replace(/\B(?=(\d{3})+(?!\d))/g, group) + (fraction === undefined ? "" : decimal + fraction);
}
