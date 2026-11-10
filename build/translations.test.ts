import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { createInstance } from "i18next";

const plural = /_(one|few|many|other|zero|two)$/;
const semantic = (key: string) => key.replace(plural, "");
const params = (text: string) => [...text.matchAll(/{{\s*([^},]+)(?:,[^}]+)?}}/g)].map((match) => match[1]).sort();

test("every translation namespace has complete English keys, interpolation and plural forms", async () => {
	const files = (await readdir("src", { recursive: true })).filter((file) => file.endsWith("translations.ts"));
	assert.equal(files.length, 23);
	for (const file of files) {
		const module = await import(pathToFileURL(path.resolve("src", file)).href);
		const resources = Object.values(module).find(
			(value): value is { ru: Record<string, string>; en: Record<string, string> } =>
				typeof value === "object" && value !== null && "ru" in value,
		);
		assert.ok(resources?.en, file);
		const { ru, en } = resources;
		assert.deepEqual(
			[...new Set(Object.keys(ru).map(semantic))].sort(),
			[...new Set(Object.keys(en).map(semantic))].sort(),
			file,
		);
		for (const [key, value] of Object.entries(ru)) {
			const translated = en[key] ?? en[`${semantic(key)}_other`];
			assert.equal(typeof translated, "string", `${file}:${key}`);
			assert.deepEqual(params(translated), params(value), `${file}:${key}`);
			assert.deepEqual(
				[...translated.matchAll(/<\/?(\w+)>/g)].map((m) => m[0]),
				[...value.matchAll(/<\/?(\w+)>/g)].map((m) => m[0]),
				`${file}:${key}:Trans`,
			);
		}
		for (const key of Object.keys(ru).filter((key) => key.endsWith("_one"))) {
			assert.ok(en[`${semantic(key)}_one`], `${file}:${key}`);
			assert.ok(en[`${semantic(key)}_other`], `${file}:${key}`);
			const i18n = createInstance();
			await i18n.init({ lng: "en", resources: { en: { translation: en } }, interpolation: { escapeValue: false } });
			for (const count of [1, 2, 5, 11, 22]) assert.notEqual(i18n.t(semantic(key), { count }), semantic(key));
		}
	}
});
