import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import biomePlugin from "vite-plugin-biome";
import { VitePWA } from "vite-plugin-pwa";

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

// https://vite.dev/config/
// GitHub Pages (project site): задать VITE_BASE_PATH=/repo-name/ в CI; локально — '/'.
const base = process.env.VITE_BASE_PATH?.replace(/\/?$/, "/") ?? "/";

export default defineConfig({
	base,
	define: {
		"import.meta.env.VITE_APP_VERSION": JSON.stringify(appVersion),
		"import.meta.env.VITE_REPO_URL": JSON.stringify(repoUrl),
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "src"),
		},
		tsconfigPaths: true,
	},
	plugins: [
		react(),
		biomePlugin(),
		tailwindcss(),
		VitePWA({
			registerType: "prompt",
			manifestFilename: "site.webmanifest",
			manifest: {
				name: "Долги",
				short_name: "Долги",
				lang: "ru",
				display: "standalone",
				theme_color: "#ffffff",
				background_color: "#ffffff",
				icons: [
					{
						src: "web-app-manifest-192x192.png",
						sizes: "192x192",
						type: "image/png",
						purpose: "maskable",
					},
					{
						src: "web-app-manifest-512x512.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "maskable",
					},
				],
			},
			includeAssets: ["favicon.ico", "apple-touch-icon.png"],
			workbox: {
				globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
				navigateFallback: `${base}index.html`,
			},
			devOptions: {
				enabled: true,
			},
		}),
	],
});
