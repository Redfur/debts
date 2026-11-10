import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { appManifest } from "./app-manifest.ts";

test("localized manifests preserve identity, URLs and existing icons at root and base path", () => {
	for (const base of ["/", "/debts/"]) {
		const ru = appManifest(base, "ru");
		const en = appManifest(base, "en");
		assert.equal(ru.id, base);
		assert.equal(en.id, ru.id);
		assert.equal(en.start_url, ru.start_url);
		assert.equal(en.scope, ru.scope);
		assert.deepEqual(en.icons, ru.icons);
		assert.equal(en.name, "Debts");
		assert.equal(ru.name, "Долги");
		assert.deepEqual(
			en.shortcuts.map((s) => s.url),
			[`${base}new`, `${base}bills/new`],
		);
		assert.deepEqual(
			en.shortcuts.map((s) => s.name),
			["New debt", "Split a bill"],
		);
		for (const resource of [...en.icons, ...en.screenshots, ...en.shortcuts.flatMap((s) => s.icons)])
			assert.ok(existsSync(`public/${resource.src}`), resource.src);
	}
});
