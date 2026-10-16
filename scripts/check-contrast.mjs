#!/usr/bin/env node
/**
 * Проверяет контраст пар токенов дизайн-системы (WCAG 2.1 AA) в светлой и тёмной теме.
 * Читает значения из `src/index.css` (блоки `:root` и `.dark`), поддерживает hex и rgba().
 * Полупрозрачный цвет смешивается с фоном пары. Выход с кодом 1 при нарушении.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const CSS_PATH = fileURLToPath(new URL("../src/index.css", import.meta.url));

/** [текст/элемент, фон, минимальный контраст]. 4.5 — текст, 3 — крупный текст и графика. */
const PAIRS = [
	["foreground", "background", 4.5],
	["foreground", "card", 4.5],
	["muted-foreground", "background", 4.5],
	["muted-foreground", "card", 4.5],
	["primary-foreground", "primary", 4.5],
	["secondary-foreground", "secondary", 4.5],
	["accent-foreground", "accent", 4.5],
	["accent-strong", "accent-muted", 4.5],
	["accent", "card", 3],
	["destructive-foreground", "destructive", 4.5],
	["destructive", "card", 4.5],
	["destructive-strong", "destructive-muted", 4.5],
	["owed-to-me-strong", "owed-to-me-muted", 4.5],
	["owed-to-me-foreground", "owed-to-me", 4.5],
	["owed-to-me", "card", 3],
	["foreground", "owed-to-me-muted", 4.5],
	["i-owe-strong", "i-owe-muted", 4.5],
	["i-owe-foreground", "i-owe", 4.5],
	["i-owe", "card", 3],
	["foreground", "i-owe-muted", 4.5],
	["success", "card", 4.5],
	["warning", "card", 4.5],
	["accent", "secondary", 3],
	["warning", "warning-muted", 4.5],
	["foreground", "nav-glass", 4.5],
	["muted-foreground", "nav-glass", 4.5],
	...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => [`avatar-${n}-foreground`, `avatar-${n}`, 4.5]),
];

function readBlock(css, selector) {
	const start = css.indexOf(`${selector} {`);
	if (start === -1) throw new Error(`Не найден блок ${selector} в ${CSS_PATH}`);
	const end = css.indexOf("\n}", start);
	const vars = {};
	for (const m of css.slice(start, end).matchAll(/--([\w-]+):\s*([^;]+);/g)) vars[m[1]] = m[2].trim();
	return vars;
}

function parseColor(value) {
	const hex = value.match(/^#([0-9a-f]{6})$/i);
	if (hex) {
		const n = Number.parseInt(hex[1], 16);
		return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
	}
	const rgba = value.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/);
	if (rgba) return { r: +rgba[1], g: +rgba[2], b: +rgba[3], a: rgba[4] === undefined ? 1 : +rgba[4] };
	return null;
}

function over(fg, bg) {
	return {
		r: fg.r * fg.a + bg.r * (1 - fg.a),
		g: fg.g * fg.a + bg.g * (1 - fg.a),
		b: fg.b * fg.a + bg.b * (1 - fg.a),
		a: 1,
	};
}

function luminance({ r, g, b }) {
	const ch = (c) => {
		const s = c / 255;
		return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

function contrast(a, b) {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
}

const css = readFileSync(CSS_PATH, "utf8");
const light = readBlock(css, ":root");
const themes = { light, dark: { ...light, ...readBlock(css, ".dark") } };

let failures = 0;
for (const [theme, vars] of Object.entries(themes)) {
	const page = parseColor(vars.background);
	for (const [fgName, bgName, min] of PAIRS) {
		const fgRaw = parseColor(vars[fgName] ?? "");
		const bgRaw = parseColor(vars[bgName] ?? "");
		if (!fgRaw || !bgRaw) {
			console.error(`✗ ${theme}: не удалось прочитать --${fgName} или --${bgName}`);
			failures++;
			continue;
		}
		const bg = bgRaw.a < 1 ? over(bgRaw, page) : bgRaw;
		const fg = fgRaw.a < 1 ? over(fgRaw, bg) : fgRaw;
		const ratio = contrast(fg, bg);
		if (ratio < min) {
			console.error(`✗ ${theme}: --${fgName} на --${bgName} = ${ratio.toFixed(2)}:1 (нужно ≥ ${min}:1)`);
			failures++;
		}
	}
}

if (failures > 0) {
	console.error(`\nНарушений контраста: ${failures}`);
	process.exit(1);
}
console.log(`✓ Контраст токенов: ${PAIRS.length} пар × 2 темы — все проходят WCAG AA`);
