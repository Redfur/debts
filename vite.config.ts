import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import biomePlugin from "vite-plugin-biome";
import { VitePWA } from "vite-plugin-pwa";
import { localizedManifestsPlugin } from "./build/app-manifest.ts";
import { changelogPlugin } from "./build/changelog-plugin";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(path.join(rootDir, "package.json"), "utf-8")) as {
	version: string;
	repository?: string | { type?: string; url?: string };
};

function normalizeRepositoryUrl(): string {
	const r = pkg.repository;
	if (!r) return "";
	const raw = typeof r === "string" ? r : r.url;
	if (!raw) return "";
	return raw
		.replace(/^git\+/, "")
		.replace(/^git@github\.com:/, "https://github.com/")
		.replace(/^ssh:\/\/git@github\.com\//, "https://github.com/")
		.replace(/\.git$/, "");
}

const appVersion = process.env.VITE_APP_VERSION ?? pkg.version;
const repoUrl = process.env.VITE_REPO_URL ?? normalizeRepositoryUrl();
// GitHub Pages (project site): VITE_BASE_PATH=/repo-name/; локально — '/'.
const base = process.env.VITE_BASE_PATH?.replace(/\/?$/, "/") ?? "/";

export default defineConfig({
	base,
	define: {
		"import.meta.env.VITE_APP_VERSION": JSON.stringify(appVersion),
		"import.meta.env.VITE_REPO_URL": JSON.stringify(repoUrl),
	},
	resolve: { alias: { "@": path.resolve(rootDir, "src") }, tsconfigPaths: true },
	plugins: [
		changelogPlugin(path.join(rootDir, "CHANGELOG.md"), appVersion),
		localizedManifestsPlugin(base),
		react(),
		biomePlugin(),
		tailwindcss(),
		VitePWA({
			registerType: "prompt",
			// Одна ссылка в HTML, оба файла генерирует localizedManifestsPlugin.
			manifest: false,
			includeAssets: ["favicon.ico", "favicon.svg", "favicon-96x96.png", "apple-touch-icon.png"],
			workbox: {
				globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webmanifest}"],
				globIgnores: ["**/screenshots/**"],
				navigateFallback: `${base}index.html`,
			},
			devOptions: { enabled: true },
		}),
	],
});
