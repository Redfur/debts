import { useTranslation } from "react-i18next";
import { SETTINGS_SCREEN_NS } from "../translations";
import { displayAppVersion } from "./settings-about-utils";

export function SettingsAboutFooter() {
	const { t } = useTranslation(SETTINGS_SCREEN_NS);
	const versionRaw = import.meta.env.VITE_APP_VERSION;
	const version = displayAppVersion(versionRaw);
	const repoUrl = import.meta.env.VITE_REPO_URL.trim();

	return (
		<div className="text-center text-muted-foreground/80 text-xs">
			<div className="space-y-1 leading-relaxed">
				<p>
					{t("aboutVersion", { version })}
					{repoUrl ? (
						<>
							{" — "}
							<a
								href={repoUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="font-medium underline-offset-4 hover:underline text-xs"
							>
								{t("aboutRepository")}
							</a>
						</>
					) : null}
				</p>
			</div>
		</div>
	);
}
