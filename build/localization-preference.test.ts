import assert from "node:assert/strict";
import test from "node:test";
import { CLIENT_STORAGE_KEYS as keys } from "../src/shared/lib/client-storage-keys.ts";
import { createLocalizationPreferences, resolveNumberFormat } from "../src/shared/lib/localization-preference-state.ts";

test("ordered system languages, regional variants, fallback and override", () => {
	const resolveLanguage = (preference: "system" | "ru" | "en", languages: string[]) => {
		const state = createLocalizationPreferences(undefined, () => languages);
		state.setLanguage(preference);
		return state.getSnapshot().language;
	};
	assert.equal(resolveLanguage("system", ["de-DE", "ru-RU", "en-US"]), "ru");
	assert.equal(resolveLanguage("system", ["EN-gb", "ru"]), "en");
	assert.equal(resolveLanguage("system", ["de", "fr"]), "en");
	assert.equal(resolveLanguage("system", []), "en");
	assert.equal(resolveLanguage("ru", ["en"]), "ru");
	assert.equal(resolveNumberFormat("language", "ru"), "space-comma");
	assert.equal(resolveNumberFormat("language", "en"), "comma-dot");
	assert.equal(resolveNumberFormat("space-dot", "ru"), "space-dot");
});

test("settings persist, react independently, reset and handle invalid keys", () => {
	const data = new Map<string, string>([
		[keys.language, "bad"],
		[keys.numberFormat, "bad"],
	]);
	const storage = {
		getItem: (key: string) => data.get(key) ?? null,
		setItem: (key: string, value: string) => {
			data.set(key, value);
		},
	};
	let languages = ["ru-RU"];
	const state = createLocalizationPreferences(storage, () => languages);
	assert.equal(state.getSnapshot().languagePreference, "system");
	assert.equal(state.getSnapshot().numberFormatPreference, "language");
	let updates = 0;
	const unsubscribe = state.subscribe(() => {
		updates++;
	});
	state.setLanguage("en");
	state.setNumberFormat("space-dot");
	assert.equal(state.getSnapshot().language, "en");
	assert.equal(state.getSnapshot().numberFormat, "space-dot");
	assert.equal(updates, 2);
	languages = ["ru"];
	state.refreshSystemLanguage();
	assert.equal(updates, 2);
	assert.deepEqual(createLocalizationPreferences(storage, () => languages).getSnapshot(), state.getSnapshot());
	state.reset();
	assert.equal(state.getSnapshot().language, "ru");
	languages = ["en"];
	state.refreshSystemLanguage();
	assert.equal(state.getSnapshot().numberFormat, "comma-dot");
	unsubscribe();
});

test("blocked storage preserves session choices", () => {
	const state = createLocalizationPreferences(
		{
			getItem() {
				throw Error("blocked");
			},
			setItem() {
				throw Error("blocked");
			},
		},
		() => [],
	);
	state.setLanguage("ru");
	state.setNumberFormat("dot-comma");
	assert.equal(state.getSnapshot().language, "ru");
	assert.equal(state.getSnapshot().numberFormat, "dot-comma");
});
