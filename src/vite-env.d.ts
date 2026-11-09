/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/vanillajs" />

declare module "virtual:changelog" {
	export type ChangelogInline = import("../build/changelog").ChangelogInline;
	export type ChangelogEntry = import("../build/changelog").ChangelogEntry;
	const entries: ChangelogEntry[];
	export default entries;
}

interface ImportMetaEnv {
	readonly VITE_APP_VERSION: string;
	readonly VITE_REPO_URL: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
