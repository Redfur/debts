import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppProviders } from "@/app/providers";
import { initPwaUpdate } from "@/features/pwa-app-update";
import { initTheme } from "@/shared/lib/theme";
import App from "./App.tsx";
import "./index.css";

initTheme();
initPwaUpdate();

// biome-ignore lint/style/noNonNullAssertion: must be defined
createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<AppProviders>
			<App />
		</AppProviders>
	</StrictMode>,
);
