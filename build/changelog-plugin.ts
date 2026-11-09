import { readFileSync } from "node:fs";
import type { Plugin } from "vite";
import { changelogForVersion } from "./changelog";

export function changelogPlugin(file: string, version: string): Plugin {
	const moduleId = "virtual:changelog";
	const resolvedId = `\0${moduleId}`;
	return {
		name: "app-changelog",
		resolveId(id) {
			if (id === moduleId) return resolvedId;
		},
		load(id) {
			if (id !== resolvedId) return;
			this.addWatchFile(file);
			const entries = changelogForVersion(readFileSync(file, "utf8"), version);
			return `export default ${JSON.stringify(entries)};`;
		},
		handleHotUpdate({ file: changedFile, server }) {
			if (changedFile !== file) return;
			const module = server.moduleGraph.getModuleById(resolvedId);
			if (module) return [module];
		},
	};
}
