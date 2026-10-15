import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { DirectionIcon } from "@/entities/debt";
import { useImportBackup } from "@/features/import-backup";
import { cn } from "@/shared/lib/utils";
import { HOME_SCREEN_NS } from "../translations";

/** Иллюстрация: две карточки итогов «мне должны / я должен». */
function OnboardingIllustration() {
	return (
		<div aria-hidden="true" className="relative h-[150px] w-[200px]">
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
	);
}

/** Главная без долгов: приветствие, «Добавить первый долг» и восстановление из копии. */
export function HomeOnboarding() {
	const { t } = useTranslation(HOME_SCREEN_NS);
	const { startImport, busy } = useImportBackup();

	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-5 px-3 py-10 text-center">
			<OnboardingIllustration />
			<div className="flex max-w-sm flex-col gap-2">
				<h2 className="text-[22px] leading-7 font-bold tracking-[-0.02em]">{t("emptyTitle")}</h2>
				<p className="text-muted-foreground text-[15px] leading-[22px]">{t("emptyBody")}</p>
			</div>
			<div className="flex w-full max-w-sm flex-col gap-1">
				<Link to="/new" className={cn(buttonVariants({ variant: "accent", size: "lg" }))}>
					<Plus className="size-5" strokeWidth={2.4} aria-hidden="true" />
					{t("emptyAdd")}
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
	);
}
