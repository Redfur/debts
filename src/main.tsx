import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initLocalizedMetadata } from "@/app/init-localized-metadata";
import { AppProviders } from "@/app/providers";
import { initInstallApp } from "@/features/install-app";
import { initPwaUpdate } from "@/features/pwa-app-update";
import { initTheme } from "@/shared/lib/theme";
import App from "./App.tsx";
import "./index.css";

initTheme();
initLocalizedMetadata();
initPwaUpdate();
initInstallApp();

// biome-ignore lint/style/noNonNullAssertion: must be defined
createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<AppProviders>
			<App />
		</AppProviders>
	</StrictMode>,
);
