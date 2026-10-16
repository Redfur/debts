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
				// Равен `start_url`, который браузеры раньше брали за id: уже установленные копии остаются тем же приложением.
				id: base,
				name: "Долги",
				short_name: "Долги",
				description: "Учёт долгов между людьми: кто кому должен. Работает без сети, данные только на устройстве.",
				lang: "ru",
				display: "standalone",
				// Фон экрана из токена `--background` (светлая тема) — цвет заставки и строки состояния.
				theme_color: "#f4f5f7",
				background_color: "#f4f5f7",
				icons: [
					{
						src: "pwa-192x192.png",
						sizes: "192x192",
						type: "image/png",
						purpose: "any",
					},
					{
						src: "pwa-512x512.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "any",
					},
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
				shortcuts: [
					{
						name: "Новый долг",
						url: `${base}new`,
						icons: [{ src: "shortcut-new-debt.png", sizes: "96x96", type: "image/png" }],
					},
					{
						name: "Разделить счёт",
						url: `${base}bills/new`,
						icons: [{ src: "shortcut-split.png", sizes: "96x96", type: "image/png" }],
					},
				],
				// Для подробного диалога установки; переснимать при заметных изменениях главной (см. docs/architecture.md).
				screenshots: [
					{ src: "screenshots/home.png", sizes: "1080x2340", type: "image/png", form_factor: "narrow" },
					{ src: "screenshots/contact.png", sizes: "1080x2340", type: "image/png", form_factor: "narrow" },
					{ src: "screenshots/bill.png", sizes: "1080x2340", type: "image/png", form_factor: "narrow" },
					{ src: "screenshots/desktop.png", sizes: "1440x900", type: "image/png", form_factor: "wide" },
				],
			},
			includeAssets: ["favicon.ico", "favicon.svg", "favicon-96x96.png", "apple-touch-icon.png"],
			workbox: {
				globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
				// Скриншоты нужны только диалогу установки — браузер скачивает их сам, в офлайн-кэш не кладём.
				globIgnores: ["**/screenshots/**"],
				navigateFallback: `${base}index.html`,
			},
			devOptions: {
				enabled: true,
			},
		}),
	],
});
