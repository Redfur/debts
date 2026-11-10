import assert from "node:assert/strict";

export async function run({ evaluate, c }) {
	await c("Page.navigate", { url: "http://127.0.0.1:4189/" });
	const result = await evaluate(`(async () => {
		const { localizationPreferences: preferences } = await import('/src/shared/lib/localization-preference.ts');
		const { i18n } = await import('/src/shared/lib/i18n.ts');
		const initialTime = performance.timeOrigin;
		let changes = 0;
		i18n.on('languageChanged', () => changes++);
		preferences.setLanguage('ru');
		preferences.setLanguage('en');
		const beforeFormat = changes;
		preferences.setNumberFormat('space-dot');
		window.dispatchEvent(new Event('languagechange'));
		return { language: i18n.language, snapshot: preferences.getSnapshot(), formatChanges: changes - beforeFormat, samePage: initialTime === performance.timeOrigin };
	})()`);
	assert.equal(result.language, "en");
	assert.equal(result.snapshot.languagePreference, "en");
	assert.equal(result.snapshot.numberFormat, "space-dot");
	assert.equal(result.formatChanges, 0);
	assert.equal(result.samePage, true);
}
