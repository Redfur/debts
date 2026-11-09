export type ChangelogGroup = "Added" | "Changed" | "Fixed" | "Removed" | "Deprecated" | "Security";

export type ChangelogInline = { kind: "text" | "code"; text: string } | { kind: "strong"; content: ChangelogInline[] };

export type ChangelogBlock =
	| { kind: "paragraph"; content: ChangelogInline[] }
	| { kind: "group"; title: ChangelogGroup; items: ChangelogInline[][] };

export interface ChangelogEntry {
	version: string;
	date: string;
	blocks: ChangelogBlock[];
}

function fail(line: number, message: string): never {
	throw new Error(`CHANGELOG.md:${line}: ${message}`);
}

function versionParts(version: string): number[] {
	if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)) {
		throw new Error(`Некорректная версия: ${version}`);
	}
	const parts = version.split(".").map(Number);
	if (!parts.every(Number.isSafeInteger)) throw new Error(`Слишком большой номер версии: ${version}`);
	return parts;
}

function compareVersions(a: string, b: string): number {
	const left = versionParts(a);
	const right = versionParts(b);
	for (let i = 0; i < 3; i++) {
		const difference = left[i] - right[i];
		if (difference) return difference;
	}
	return 0;
}

function isGroup(value: string): value is ChangelogGroup {
	return ["Added", "Changed", "Fixed", "Removed", "Deprecated", "Security"].includes(value);
}

function inline(text: string, line: number): ChangelogInline[] {
	const tokens: ChangelogInline[] = [];
	let rest = text;
	while (rest) {
		const marker = /`|\*\*/.exec(rest);
		if (!marker) {
			tokens.push({ kind: "text", text: rest });
			break;
		}
		if (marker.index) tokens.push({ kind: "text", text: rest.slice(0, marker.index) });
		const start = marker.index + marker[0].length;
		const end = rest.indexOf(marker[0], start);
		if (end < 0) fail(line, `Незакрытый маркер ${marker[0]}`);
		const content = rest.slice(start, end);
		tokens.push(
			marker[0] === "`" ? { kind: "code", text: content } : { kind: "strong", content: inline(content, line) },
		);
		rest = rest.slice(end + marker[0].length);
	}
	return tokens;
}

/** Разбирает используемое в проекте подмножество Keep a Changelog без HTML и клиентского парсера. */
export function parseChangelog(source: string): ChangelogEntry[] {
	const entries: ChangelogEntry[] = [];
	const versions = new Set<string>();
	let entry: ChangelogEntry | undefined;
	let group: Extract<ChangelogBlock, { kind: "group" }> | undefined;
	let pending: { kind: "paragraph" | "item"; text: string; line: number } | undefined;

	function flush() {
		if (!pending || !entry) return;
		const content = inline(pending.text, pending.line);
		if (pending.kind === "item" && group) group.items.push(content);
		else entry.blocks.push({ kind: "paragraph", content });
		pending = undefined;
	}

	for (const [index, raw] of source.replace(/\r\n/g, "\n").split("\n").entries()) {
		const line = index + 1;
		if (raw.startsWith("## ")) {
			flush();
			entry = undefined;
			group = undefined;
			if (raw.trim() === "## [Unreleased]") continue;
			const header = /^## \[(\d+\.\d+\.\d+)\] - (\d{4}-\d{2}-\d{2})\s*$/.exec(raw);
			if (!header) fail(line, "Ожидается заголовок ## [X.Y.Z] - YYYY-MM-DD");
			const [, version, date] = header;
			try {
				versionParts(version);
			} catch {
				fail(line, `Некорректная версия ${version}`);
			}
			if (versions.has(version)) fail(line, `Повтор версии ${version}`);
			const timestamp = Date.parse(`${date}T00:00:00Z`);
			if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== date) {
				fail(line, `Некорректная дата ${date}`);
			}
			versions.add(version);
			entry = { version, date, blocks: [] };
			entries.push(entry);
			continue;
		}
		if (!entry) continue;
		if (!raw.trim()) {
			flush();
			continue;
		}
		if (raw.startsWith("### ")) {
			flush();
			const title = raw.slice(4).trim();
			if (!isGroup(title)) fail(line, `Неизвестная группа ${title}`);
			group = { kind: "group", title, items: [] };
			entry.blocks.push(group);
			continue;
		}
		if (/^\s*(?:#|>|`{3}|~{3}|\||\* |\+ |\d+[.)] |---\s*$)/.test(raw) || /^\s+- /.test(raw)) {
			fail(line, "Неподдержанный формат блока");
		}
		if (raw.startsWith("- ")) {
			flush();
			if (!group) fail(line, "Пункт списка должен находиться в группе изменений");
			pending = { kind: "item", text: raw.slice(2).trim(), line };
		} else if (pending) {
			pending.text += ` ${raw.trim()}`;
		} else {
			if (group) fail(line, "Ожидается пункт списка, начинающийся с '- '");
			pending = { kind: "paragraph", text: raw.trim(), line };
		}
	}
	flush();
	for (const record of entries) {
		record.blocks = record.blocks.filter((block) => block.kind !== "group" || block.items.length > 0);
	}
	return entries;
}

export function changelogForVersion(source: string, appVersion: string): ChangelogEntry[] {
	const version = appVersion.replace(/^v/, "");
	versionParts(version);
	return parseChangelog(source)
		.filter((entry) => compareVersions(entry.version, version) <= 0)
		.sort((a, b) => compareVersions(b.version, a.version));
}
