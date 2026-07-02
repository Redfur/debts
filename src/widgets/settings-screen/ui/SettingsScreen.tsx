import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExchangeRateStatusRow } from "@/features/refresh-exchange-rates";
import { DisplayCurrencySelect } from "@/features/set-display-currency";
import { PageHeader, ScreenBody } from "@/shared/layout";
import { clearClientStoragePreferences } from "@/shared/lib/clear-client-storage";
import { wipeAppIndexedDatabase } from "@/shared/lib/storage";
import { SETTINGS_SCREEN_NS } from "../translations";
import { BackupActionsCard } from "./BackupActionsCard";
import { ConfirmDangerRow } from "./ConfirmDangerRow";
import { SettingsAboutFooter } from "./SettingsAboutFooter";
import { ThemePreferenceSelect } from "./ThemePreferenceSelect";

export function SettingsScreen() {
	const { t } = useTranslation(SETTINGS_SCREEN_NS);

	const handleClearIndexedDb = async () => {
		await wipeAppIndexedDatabase();
		window.location.reload();
	};

	const handleClearLocalPreferences = () => {
		clearClientStoragePreferences();
	};

	const handleClearAll = async () => {
		await wipeAppIndexedDatabase();
		clearClientStoragePreferences();
		window.location.reload();
	};

	return (
		<ScreenBody gap="compact">
			<PageHeader title={t("title")} />

			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-sm font-medium" id="settings-theme-heading">
						{t("themeSection")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<ThemePreferenceSelect labelId="settings-theme-heading" />
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-sm font-medium" id="settings-currency-heading">
						{t("currencySection")}
					</CardTitle>
					<CardDescription className="text-xs">{t("currencyHint")}</CardDescription>
				</CardHeader>
				<CardContent>
					<DisplayCurrencySelect labelId="settings-currency-heading" />
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-sm font-medium">{t("ratesSection")}</CardTitle>
				</CardHeader>
				<CardContent>
					<ExchangeRateStatusRow />
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-sm font-medium" id="settings-lang-heading">
						{t("languageSection")}
					</CardTitle>
					<CardDescription className="text-xs">{t("languageHint")}</CardDescription>
				</CardHeader>
				<CardContent>
					<Select disabled value="ru">
						<SelectTrigger
							id="language-select"
							aria-labelledby="settings-lang-heading"
							className="max-w-full min-w-0 w-full"
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="ru">{t("languageCurrent")}</SelectItem>
						</SelectContent>
					</Select>
				</CardContent>
			</Card>

			<BackupActionsCard />

			<Card className="border-destructive/40">
				<CardHeader className="pb-2">
					<CardTitle className="text-destructive text-sm font-medium">{t("dangerSection")}</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-3">
					<ConfirmDangerRow
						description={t("clearIndexedDbDetail")}
						title={t("clearIndexedDbConfirm")}
						body={t("clearIndexedDbDetail")}
						confirmLabel={t("confirmAction")}
						cancelLabel={t("cancelDialog")}
						triggerLabel={t("clearIndexedDb")}
						onConfirm={() => void handleClearIndexedDb()}
					/>
					<ConfirmDangerRow
						description={t("clearLocalStorageDetail")}
						title={t("clearLocalStorageConfirm")}
						body={t("clearLocalStorageDetail")}
						confirmLabel={t("confirmAction")}
						cancelLabel={t("cancelDialog")}
						triggerLabel={t("clearLocalStorage")}
						onConfirm={handleClearLocalPreferences}
					/>
					<ConfirmDangerRow
						description={t("clearAllDetail")}
						title={t("clearAllConfirm")}
						body={t("clearAllDetail")}
						confirmLabel={t("confirmAction")}
						cancelLabel={t("cancelDialog")}
						triggerLabel={t("clearAll")}
						onConfirm={() => void handleClearAll()}
					/>
				</CardContent>
			</Card>

			<SettingsAboutFooter />
		</ScreenBody>
	);
}
