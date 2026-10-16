import { AppWindow, CircleCheck, Globe, type LucideIcon, Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { useStoragePersistence } from "../model/storage-persistence";
import { useInstallState } from "../model/use-install-state";
import { INSTALL_APP_NS } from "../translations";
import { InstallActionButton } from "./InstallActionButton";

type Tone = "success" | "warning" | "muted";

const TONE_CLASS: Record<Tone, string> = {
	success: "text-success font-semibold",
	warning: "text-warning font-semibold",
	muted: "text-muted-foreground",
};

const ACTION_CLASS = "ml-auto h-11 pr-3.5 pl-3 text-sm lg:ml-0 lg:pr-4 lg:pl-3.5";

function StatusRow({
	label,
	value,
	icon: Icon,
	tone,
	action,
}: {
	label: string;
	value: string;
	icon: LucideIcon;
	tone: Tone;
	action?: ReactNode;
}) {
	return (
		<div className="flex min-h-16 flex-wrap items-center gap-x-3 gap-y-2 py-2.5 pr-2.5 pl-4 lg:min-h-15 lg:gap-x-4 lg:p-0">
			<span className="flex min-w-0 flex-[1_1_170px] flex-col gap-0.5 lg:flex-[1_1_200px]">
				<span className="text-body lg:text-[15px] lg:font-medium">{label}</span>
				<span aria-live="polite" className={cn("text-caption flex items-start gap-[5px]", TONE_CLASS[tone])}>
					<Icon
						className="mt-[1.5px] size-[15px] shrink-0"
						strokeWidth={tone === "muted" ? 2 : 2.2}
						aria-hidden="true"
					/>
					{value}
				</span>
			</span>
			{action}
		</div>
	);
}

type Props = {
	onSaveBackup: () => void | Promise<void>;
	/** Классы карточки-списка и подсказки — из раскладки настроек. */
	listClassName?: string;
	hintClassName?: string;
};

/** Группа «Приложение» в настройках: режим работы с действием установки и защита данных от автоочистки. */
export function InstallSettingsRows({ onSaveBackup, listClassName, hintClassName }: Props) {
	const { t } = useTranslation(INSTALL_APP_NS);
	const state = useInstallState();
	const storage = useStoragePersistence();

	const install =
		state.mode === "installed"
			? { value: t("installStateInstalled"), icon: CircleCheck, tone: "success" as const }
			: state.installedNow
				? { value: t("installStateInstalledNow"), icon: CircleCheck, tone: "success" as const }
				: state.mode === "in-app"
					? { value: t("installStateInApp"), icon: AppWindow, tone: "muted" as const }
					: { value: t("installStateBrowser"), icon: Globe, tone: "muted" as const };

	const handleProtect = async () => {
		if (await storage.protect()) toast.success(t("storageProtected"));
		else toast.error(t("storageRefused"), { duration: 8000 });
	};

	const showStorage = storage.status === "persisted" || storage.status === "at-risk";
	const atRisk = storage.status === "at-risk";

	return (
		<>
			<div
				className={cn("lg:grid lg:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] lg:gap-x-8 lg:gap-y-3", listClassName)}
			>
				<StatusRow
					label={t("installLabel")}
					{...install}
					action={
						state.installedNow ? null : (
							<InstallActionButton onSaveBackup={onSaveBackup} className={ACTION_CLASS} iconClassName="size-4" />
						)
					}
				/>
				{showStorage ? (
					<>
						<div aria-hidden="true" className="bg-border ml-4 h-px lg:hidden" />
						<StatusRow
							label={t("storageLabel")}
							value={t(atRisk ? "storageAtRisk" : "storagePersisted")}
							icon={atRisk ? ShieldAlert : ShieldCheck}
							tone={atRisk ? "warning" : "success"}
							action={
								atRisk ? (
									<Button
										type="button"
										variant="secondary"
										className={cn("gap-2", ACTION_CLASS)}
										onClick={() => void handleProtect()}
									>
										<Shield className="text-accent size-4" aria-hidden="true" />
										{t("storageProtect")}
									</Button>
								) : null
							}
						/>
					</>
				) : null}
			</div>
			{atRisk ? <p className={hintClassName}>{t("storageHint")}</p> : null}
		</>
	);
}
