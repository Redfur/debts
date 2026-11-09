// Запуск: node --experimental-strip-types --test build/changelog.test.ts (Node 22+).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { changelogForVersion, parseChangelog } from "./changelog.ts";

test("полный changelog: все версии, абзацы и предупреждения без служебного вступления", () => {
	const source = readFileSync(new URL("../CHANGELOG.md", import.meta.url), "utf8");
	const entries = parseChangelog(source);
	assert.equal(entries.length, [...source.matchAll(/^## \[\d+\.\d+\.\d+\]/gm)].length);
	assert.equal(entries.find((entry) => entry.version === "0.1.0")?.blocks[0].kind, "paragraph");
	assert.equal(entries.find((entry) => entry.version === "1.0.0")?.blocks[0].kind, "paragraph");
	for (const version of ["2.1.0", "2.3.0"]) {
		assert.match(JSON.stringify(entries.find((entry) => entry.version === version)), /strong/);
	}
});

test("исключение Unreleased, пустых групп и сохранение продолжений и inline-разметки", () => {
	const entries = parseChangelog(`# Changelog
Правила ведения
## [Unreleased]
### Что угодно
> Неопубликованное описание
## [1.0.0] - 2026-11-07
Первый релиз.

### Changed
### Added
- **Важное** и \`код\`
  продолжение пункта
`);
	assert.deepEqual(entries, [
		{
			version: "1.0.0",
			date: "2026-11-07",
			blocks: [
				{ kind: "paragraph", content: [{ kind: "text", text: "Первый релиз." }] },
				{
					kind: "group",
					title: "Added",
					items: [
						[
							{ kind: "strong", content: [{ kind: "text", text: "Важное" }] },
							{ kind: "text", text: " и " },
							{ kind: "code", text: "код" },
							{ kind: "text", text: " продолжение пункта" },
						],
					],
				},
			],
		},
	]);
});

test("числовой порядок и версия сборки, включая v и отсутствие точного раздела", () => {
	const source = ["2.9.0", "2.10.0", "2.3.1"].map((v) => `## [${v}] - 2026-11-07\nОписание.`).join("\n");
	assert.deepEqual(
		changelogForVersion(source, "2.11.0").map((entry) => entry.version),
		["2.10.0", "2.9.0", "2.3.1"],
	);
	assert.deepEqual(
		changelogForVersion(source, "v2.3.1").map((entry) => entry.version),
		["2.3.1"],
	);
	assert.deepEqual(changelogForVersion(source, "1.0.0"), []);
	assert.deepEqual(changelogForVersion("## [Unreleased]\nОписание", "2.0.0"), []);
	assert.throws(() => changelogForVersion(source, "dev"), /Некорректная версия/);
});

test("неподдержанный формат и повреждённые записи дают ошибку с номером строки", () => {
	for (const body of ["### Unknown", "| таблица |", "- Пункт без группы", "### Fixed\n- **Не закрыто"]) {
		assert.throws(() => parseChangelog(`## [1.0.0] - 2026-11-07\n${body}`), /CHANGELOG\.md:\d+:/);
	}
	for (const date of ["2026-02-30", "2026-13-01", "2026-00-07"]) {
		assert.throws(() => parseChangelog(`## [1.0.0] - ${date}`), /Некорректная дата/);
	}
	assert.throws(() => parseChangelog("## [1.0.0] - 2026-11-07\n## [1.0.0] - 2026-11-08"), /Повтор версии/);
	assert.throws(() => parseChangelog("## [01.0.0] - 2026-11-07"), /Некорректная версия/);
});
