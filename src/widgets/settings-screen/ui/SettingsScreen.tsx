import { ChevronDown, ChevronRight, Download, Upload } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SegmentedControl, SegmentedControlItem } from "@/components/ui/segmented-control";
import { useExportBackup } from "@/features/export-backup";
import { useImportBackup } from "@/features/import-backup";
import { ExchangeRateStatusRow } from "@/features/refresh-exchange-rates";
import { DisplayCurrencySetting } from "@/features/set-display-currency";
import { COMMON_NS } from "@/shared/i18n";
import { PageHeader, ScreenBody } from "@/shared/layout";
import { clearClientStoragePreferences } from "@/shared/lib/clear-client-storage";
import { wipeAppIndexedDatabase } from "@/shared/lib/storage";
import {
	getThemePreference,
	setThemePreference,
	THEME_CHANGE_EVENT,
	type ThemeChangeDetail,
	type ThemePreference,
} from "@/shared/lib/theme";
import { cn } from "@/shared/lib/utils";
import { showConfirmActionModal } from "@/shared/ui/modals";
import { SETTINGS_SCREEN_NS } from "../translations";
import { displayAppVersion } from "./settings-about-utils";

/**
 * Группа настроек. На мобильном — подпись над карточкой-списком (как в системных настройках),
 * на десктопе (от 1024 px) — карточка с заголовком внутри в сетке групп.
 */
function SettingsSection({
	title,
	danger,
	className,
	children,
}: {
	title: string;
	danger?: boolean;
	className?: string;
	children: ReactNode;
}) {
	return (
		<section className={cn("flex flex-col gap-2 lg:gap-3 lg:rounded-card lg:bg-card lg:p-5 lg:shadow-card", className)}>
			<h2
				className={cn(
					"text-caption mx-1 font-semibold lg:text-heading lg:mx-0",
					danger ? "text-destructive" : "text-muted-foreground lg:text-foreground",
				)}
			>
				{title}
			</h2>
			{children}
		</section>
	);
}

/** Карточка-список строк на мобильном; на десктопе — без фона, строки прямо в карточке группы. */
const LIST_CLASS =
	"bg-card shadow-card flex flex-col overflow-hidden rounded-[20px] lg:rounded-none lg:bg-transparent lg:shadow-none";
const HINT_CLASS = "text-caption text-muted-foreground mx-1 lg:mx-0";
const ROW_BUTTON_CLASS =
	"hover:bg-secondary focus-visible:bg-secondary flex w-full items-center gap-3 text-left outline-none transition-colors";

function Divider({ inset = "ml-4" }: { inset?: string }) {
	return <div aria-hidden="true" className={cn("bg-border h-px lg:ml-0", inset)} />;
}

function useThemePreference(): [ThemePreference, (value: ThemePreference) => void] {
	const [preference, setPreference] = useState<ThemePreference>(() => getThemePreference());
	useEffect(() => {
		const onChange = (e: Event) => {
			const ce = e as CustomEvent<ThemeChangeDetail>;
			if (ce.detail?.preference) setPreference(ce.detail.preference);
		};
		window.addEventListener(THEME_CHANGE_EVENT, onChange);
		return () => window.removeEventListener(THEME_CHANGE_EVENT, onChange);
	}, []);
	const update = (value: ThemePreference) => {
		setThemePreference(value);
		setPreference(value);
	};
	return [preference, update];
}

type ResetAction = {
	id: string;
	title: string;
	hint: string;
	action: string;
	strong?: boolean;
	onClick: () => void;
};

export function SettingsScreen() {
	const { t } = useTranslation(SETTINGS_SCREEN_NS);
	const { t: tCommon } = useTranslation(COMMON_NS);
	const [theme, setTheme] = useThemePreference();
	const exporter = useExportBackup();
	const importer = useImportBackup();
	const version = displayAppVersion(import.meta.env.VITE_APP_VERSION);
	const repoUrl = import.meta.env.VITE_REPO_URL.trim();

	const confirm = (
		title: string,
		body: string,
		confirmLabel: string,
		onConfirm: () => void | Promise<void>,
		destructive = true,
	) =>
		void showConfirmActionModal({
			title,
			body,
			confirmLabel,
			cancelLabel: tCommon("cancel"),
			onConfirm,
			confirmVariant: destructive ? "destructive" : "default",
		});

	const resetActions: ResetAction[] = [
		{
			id: "data",
			title: t("clearData"),
			hint: t("clearDataHint"),
			action: t("clearDataAction"),
			onClick: () =>
				confirm(t("clearDataConfirmTitle"), t("clearDataConfirmBody"), t("clearDataAction"), async () => {
					await wipeAppIndexedDatabase();
					window.location.reload();
				}),
		},
		{
			id: "prefs",
			title: t("resetPrefs"),
			hint: t("resetPrefsHint"),
			action: t("resetPrefsAction"),
			onClick: () =>
				confirm(
					t("resetPrefsConfirmTitle"),
					t("resetPrefsConfirmBody"),
					t("resetPrefsAction"),
					() => {
						clearClientStoragePreferences();
						toast.success(t("resetPrefsDone"));
					},
					false,
				),
		},
		{
			id: "all",
			title: t("clearAll"),
			hint: t("clearAllHint"),
			action: t("clearAll"),
			strong: true,
			onClick: () =>
				confirm(t("clearAllConfirmTitle"), t("clearAllConfirmBody"), t("clearAll"), async () => {
					await wipeAppIndexedDatabase();
					clearClientStoragePreferences();
					window.location.reload();
				}),
		},
	];

	return (
		<ScreenBody gap="comfortable" className="lg:max-w-[960px]">
			<PageHeader title={t("title")} />

			<div className="flex flex-col gap-5 lg:grid lg:grid-cols-[repeat(auto-fit,minmax(360px,1fr))] lg:items-start lg:gap-4">
				<SettingsSection title={t("themeSection")} className="order-1">
					<SegmentedControl
						aria-label={t("themeSection")}
						value={theme}
						onValueChange={(v) => {
							if (v === "system" || v === "light" || v === "dark") setTheme(v);
						}}
						className="bg-muted dark:bg-card rounded-control lg:bg-secondary dark:lg:bg-secondary grid-cols-3 lg:rounded-[16px]"
					>
						{(["system", "light", "dark"] as const).map((value) => (
							<SegmentedControlItem
								key={value}
								value={value}
								className="text-foreground dark:data-[state=on]:bg-muted lg:dark:data-[state=on]:bg-card min-h-11 rounded-field px-1 text-[15px] whitespace-nowrap lg:min-h-10 lg:rounded-[12px] lg:text-sm"
							>
								{t(value === "system" ? "themeSystem" : value === "light" ? "themeLight" : "themeDark")}
							</SegmentedControlItem>
						))}
					</SegmentedControl>
				</SettingsSection>

				<SettingsSection title={t("currencySection")} className="order-2">
					<div className={LIST_CLASS}>
						<DisplayCurrencySetting />
						<Divider />
						<ExchangeRateStatusRow className="min-h-16 py-2 pr-2.5 pl-4 lg:min-h-12 lg:px-0" />
					</div>
				</SettingsSection>

				<SettingsSection title={t("languageSection")} className="order-3 lg:order-4">
					<div aria-disabled="true" className={cn(LIST_CLASS, "min-h-13 flex-row items-center gap-3 px-4 lg:hidden")}>
						<span className="text-body flex-1">{t("languageLabel")}</span>
						<span className="text-muted-foreground text-[15px]">{t("languageCurrent")}</span>
					</div>
					<div
						aria-disabled="true"
						className="bg-secondary text-muted-foreground hidden min-h-11 items-center justify-between rounded-[12px] px-3.5 text-[15px] lg:flex"
					>
						{t("languageCurrent")}
						<ChevronDown className="size-4" aria-hidden="true" />
					</div>
					<p className={HINT_CLASS}>{t("languageHint")}</p>
				</SettingsSection>

				<SettingsSection title={t("backupSection")} className="order-4 lg:order-3">
					<div className={cn(LIST_CLASS, "order-1 lg:hidden")}>
						<button
							type="button"
							disabled={exporter.busy}
							onClick={() => void exporter.exportBackup()}
							className={cn(ROW_BUTTON_CLASS, "text-body min-h-13 px-4 disabled:opacity-60")}
						>
							<Download className="text-muted-foreground size-5" aria-hidden="true" />
							{exporter.label}
						</button>
						<Divider inset="ml-12" />
						<button
							type="button"
							disabled={importer.busy}
							onClick={() => void importer.startImport()}
							className={cn(ROW_BUTTON_CLASS, "text-body min-h-13 px-4 disabled:opacity-60")}
						>
							<Upload className="text-muted-foreground size-5" aria-hidden="true" />
							{importer.label}
						</button>
					</div>
					<p className={cn(HINT_CLASS, "order-2 lg:order-1 lg:text-body-s")}>{t("backupHint")}</p>
					<div className="order-2 mt-1 hidden flex-wrap gap-2 lg:flex">
						<Button
							type="button"
							variant="secondary"
							disabled={exporter.busy}
							onClick={() => void exporter.exportBackup()}
							className="font-medium"
						>
							<Download aria-hidden="true" />
							{exporter.label}
						</Button>
						<Button
							type="button"
							variant="secondary"
							disabled={importer.busy}
							onClick={() => void importer.startImport()}
							className="font-medium"
						>
							<Upload aria-hidden="true" />
							{importer.label}
						</Button>
					</div>
				</SettingsSection>

				<SettingsSection title={t("resetSection")} danger className="order-5 lg:col-span-full">
					<div className={cn(LIST_CLASS, "lg:hidden")}>
						{resetActions.map((item, index) => (
							<div key={item.id}>
								{index > 0 ? <Divider /> : null}
								<button
									type="button"
									onClick={item.onClick}
									className={cn(ROW_BUTTON_CLASS, "min-h-16 py-2.5 pr-3 pl-4")}
								>
									<span className="flex min-w-0 flex-1 flex-col gap-0.5">
										<span className={cn("text-body text-destructive", item.strong ? "font-semibold" : "font-medium")}>
											{item.title}
										</span>
										<span className="text-caption text-muted-foreground">{item.hint}</span>
									</span>
									<ChevronRight className="text-muted-foreground size-5 shrink-0" aria-hidden="true" />
								</button>
							</div>
						))}
					</div>
					<div className="hidden flex-col lg:flex">
						{resetActions.map((item, index) => (
							<div key={item.id}>
								{index > 0 ? <Divider /> : null}
								<div className="flex min-h-15 flex-wrap items-center gap-x-4 gap-y-2 py-2">
									<span className="flex min-w-60 flex-1 flex-col">
										<span className={cn("text-[15px]", item.strong ? "font-semibold" : "font-medium")}>
											{item.title}
										</span>
										<span className="text-caption text-muted-foreground">{item.hint}</span>
									</span>
									<Button
										type="button"
										variant={item.strong ? "destructive" : "destructive-soft"}
										onClick={item.onClick}
										className="h-10"
									>
										{item.action}
									</Button>
								</div>
							</div>
						))}
					</div>
				</SettingsSection>
			</div>

			<p className="text-caption text-muted-foreground text-center lg:text-left">
				{t("aboutVersion", { version })}
				{repoUrl ? (
					<>
						{" · "}
						<a
							href={repoUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="text-accent inline-block py-3 font-medium outline-none hover:underline focus-visible:underline"
						>
							{t("aboutRepository")}
						</a>
					</>
				) : null}
			</p>
		</ScreenBody>
	);
}
