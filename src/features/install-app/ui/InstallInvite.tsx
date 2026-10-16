import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { useInstallBannerDismissal } from "../model/banner-dismissal";
import { needsDataMove, shouldInviteToInstall, useHasRecords, useInstallState } from "../model/use-install-state";
import { INSTALL_APP_NS } from "../translations";
import { InstallActionButton } from "./InstallActionButton";

/** Знак приложения: карточка с рамкой и полосами «мне должны» / «я должен». */
function AppMark({ className }: { className?: string }) {
	return (
		<span
			aria-hidden="true"
			className={cn(
				"bg-card dark:bg-background border-foreground flex shrink-0 flex-col justify-center gap-1 rounded-[11px] border-[1.5px] px-2",
				className,
			)}
		>
			<span className="bg-owed-to-me h-[5px] rounded-full" />
			<span className="bg-i-owe h-[5px] w-3/5 rounded-full" />
		</span>
	);
}

type InviteProps = { onSaveBackup: () => void | Promise<void> };

/** Карточка на пустой главной (только телефон): установить, пока записей нет и переносить нечего. */
export function InstallOnboardingCard({ onSaveBackup }: InviteProps) {
	const { t } = useTranslation(INSTALL_APP_NS);
	const state = useInstallState();
	if (!shouldInviteToInstall(state)) return null;

	const title = t("cardTitle");
	return (
		<section
			aria-label={title}
			className="bg-card shadow-card flex w-full flex-col gap-3 rounded-card p-4 text-left lg:hidden"
		>
			<div className="flex items-start gap-3">
				<AppMark className="size-11" />
				<div className="flex min-w-0 flex-1 flex-col gap-0.5">
					<h2 className="text-[17px] leading-6 font-semibold tracking-[-0.01em]">{title}</h2>
					<p className="text-muted-foreground text-sm leading-5">
						{t(needsDataMove(state) ? "cardTextMove" : "cardText")}
					</p>
				</div>
			</div>
			<div className="flex pl-14">
				<InstallActionButton onSaveBackup={onSaveBackup} className="pr-4 pl-3.5 text-[15px]" />
			</div>
		</section>
	);
}

/** Плашка над итогами главной (только телефон), пока есть записи и её не закрыли. */
export function InstallBanner({ onSaveBackup }: InviteProps) {
	const { t } = useTranslation(INSTALL_APP_NS);
	const state = useInstallState();
	const hasRecords = useHasRecords();
	const [dismissed, dismiss] = useInstallBannerDismissal();
	if (!shouldInviteToInstall(state) || !hasRecords || dismissed) return null;

	const title = t("bannerTitle");
	return (
		<section
			aria-label={title}
			className="bg-card shadow-card mb-2 flex flex-col gap-3 rounded-[20px] py-3 pr-3 pl-3.5 lg:hidden"
		>
			<div className="flex items-start gap-3">
				<AppMark className="size-10" />
				<div className="flex min-w-0 flex-1 flex-col gap-0.5">
					<h2 className="text-[15px] leading-5 font-semibold tracking-[-0.01em]">{title}</h2>
					<p className="text-caption text-muted-foreground">
						{t(needsDataMove(state) ? "bannerTextMove" : "bannerText")}
					</p>
				</div>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					aria-label={t("close")}
					onClick={dismiss}
					className="text-muted-foreground -mt-2.5 -mr-2"
				>
					<X className="size-5" aria-hidden="true" />
				</Button>
			</div>
			<div className="flex pl-13">
				<InstallActionButton onSaveBackup={onSaveBackup} className="pr-4 pl-3.5 text-[15px]" />
			</div>
		</section>
	);
}
