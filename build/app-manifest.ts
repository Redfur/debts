import type { Plugin } from "vite";
import { APP_METADATA } from "../src/shared/config/app-metadata.ts";

export function appManifest(base: string, language: "ru" | "en") {
	const text = APP_METADATA[language];
	return {
		// Равен прежнему start_url: не менять идентичность установленного приложения.
		id: base,
		start_url: base,
		scope: base,
		name: text.name,
		short_name: text.name,
		description: text.description,
		lang: language,
		display: "standalone",
		theme_color: "#f4f5f7",
		background_color: "#f4f5f7",
		icons: [
			{ src: "pwa-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
			{ src: "pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
			{ src: "web-app-manifest-192x192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
			{ src: "web-app-manifest-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
		],
		shortcuts: [
			{
				name: text.newDebt,
				url: `${base}new`,
				icons: [{ src: "shortcut-new-debt.png", sizes: "96x96", type: "image/png" }],
			},
			{
				name: text.splitBill,
				url: `${base}bills/new`,
				icons: [{ src: "shortcut-split.png", sizes: "96x96", type: "image/png" }],
			},
		],
		// Пока общие иллюстрации русской версии, не включаются в precache.
		screenshots: [
			{ src: "screenshots/home.png", sizes: "1080x2340", type: "image/png", form_factor: "narrow" },
			{ src: "screenshots/contact.png", sizes: "1080x2340", type: "image/png", form_factor: "narrow" },
			{ src: "screenshots/bill.png", sizes: "1080x2340", type: "image/png", form_factor: "narrow" },
			{ src: "screenshots/desktop.png", sizes: "1440x900", type: "image/png", form_factor: "wide" },
		],
	};
}

export function localizedManifestsPlugin(base: string): Plugin {
	const files = new Map([
		["site.webmanifest", JSON.stringify(appManifest(base, "ru"))],
		["site.en.webmanifest", JSON.stringify(appManifest(base, "en"))],
	]);
	return {
		name: "localized-app-manifests",
		configureServer(server) {
			server.middlewares.use((request, response, next) => {
				const pathname = request.url?.split("?")[0];
				const source = pathname ? files.get(pathname.slice(pathname.lastIndexOf("/") + 1)) : undefined;
				if (!source) return next();
				response.setHeader("Content-Type", "application/manifest+json");
				response.end(source);
			});
		},
		generateBundle() {
			for (const [fileName, source] of files) this.emitFile({ type: "asset", fileName, source });
		},
	};
}
