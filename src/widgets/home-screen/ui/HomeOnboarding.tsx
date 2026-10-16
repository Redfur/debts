import { Plus, Split } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { DirectionIcon } from "@/entities/debt";
import { useExportBackup } from "@/features/export-backup";
import { useImportBackup } from "@/features/import-backup";
import { InstallOnboardingCard, useInstallInvitation } from "@/features/install-app";
import { cn } from "@/shared/lib/utils";
import { HOME_SCREEN_NS } from "../translations";

/** Иллюстрация: две карточки итогов «мне должны / я должен»; `compact` — 3/4 размера на телефоне. */
function OnboardingIllustration({ compact }: { compact: boolean }) {
	return (
		<div
			aria-hidden="true"
			className={cn("relative h-[150px] w-[200px]", compact && "max-lg:h-[112px] max-lg:w-[150px]")}
		>
			<div
				className={cn("absolute top-0 left-0 h-[150px] w-[200px]", compact && "max-lg:origin-top-left max-lg:scale-75")}
			>
				<div className="bg-i-owe-muted absolute top-[18px] left-3.5 h-[92px] w-[150px] -rotate-8 rounded-card" />
				<div className="bg-owed-to-me-muted absolute top-10 left-[38px] flex h-[92px] w-[150px] rotate-5 flex-col justify-center gap-2.5 rounded-card px-[18px] shadow-[0_8px_24px_rgba(23,26,33,0.08)]">
					<span className="flex items-center gap-2">
						<DirectionIcon direction="owed_to_me" />
						<span className="bg-owed-to-me-strong/25 h-2 w-[70px] rounded-full" />
					</span>
					<span className="flex h-2 gap-[3px]">
						<span className="bg-owed-to-me flex-3 rounded-full" />
						<span className="bg-i-owe flex-2 rounded-full" />
					</span>
				</div>
			</div>
		</div>
	);
}

/**
 * Главная без долгов и счетов: приветствие, «Добавить первый долг», «Разделить счёт», восстановление из копии
 * и внизу на телефоне — приглашение установить приложение.
 */
export function HomeOnboarding() {
	const { t } = useTranslation(HOME_SCREEN_NS);
	const { startImport, busy } = useImportBackup();
	const { exportBackup } = useExportBackup();
	// С карточкой установки приветствие на телефоне компактнее, чтобы карточка помещалась над нижним меню.
	const compact = useInstallInvitation();

	return (
		<div className="flex flex-1 flex-col gap-2">
			<div
				className={cn(
					"flex flex-1 flex-col items-center justify-center gap-5 px-3 py-10 text-center",
					compact && "max-lg:gap-4 max-lg:pt-2 max-lg:pb-4",
				)}
			>
				<OnboardingIllustration compact={compact} />
				<div className="flex max-w-sm flex-col gap-2">
					<h2 className="text-[22px] leading-7 font-bold tracking-[-0.02em]">{t("emptyTitle")}</h2>
					<p className="text-muted-foreground text-[15px] leading-[22px]">{t("emptyBody")}</p>
				</div>
				<div className={cn("flex w-full max-w-sm flex-col gap-1", compact && "max-lg:gap-0.5")}>
					<Link to="/new" className={cn(buttonVariants({ variant: "accent", size: "lg" }))}>
						<Plus className="size-5" strokeWidth={2.4} aria-hidden="true" />
						{t("emptyAdd")}
					</Link>
					<Link
						to="/bills/new"
						state={{ backTo: "/" }}
						className={cn(
							buttonVariants({ variant: "secondary", size: "lg" }),
							"bg-card shadow-card hover:bg-card/80 mt-1",
						)}
					>
						<Split className="size-5" aria-hidden="true" />
						{t("emptySplit")}
					</Link>
					<button
						type="button"
						disabled={busy}
						onClick={() => void startImport()}
						className={cn(buttonVariants({ variant: "link" }), "h-11 text-[15px] font-medium")}
					>
						{t("emptyRestore")}
					</button>
				</div>
			</div>
			<InstallOnboardingCard onSaveBackup={exportBackup} />
		</div>
	);
}
