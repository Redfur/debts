import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { Copy, Download, EllipsisVertical, Info, Link2, type LucideIcon, Share, SquarePlus, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/shared/lib/utils";
import { needsDataMove, useHasRecords, useInstallState } from "../model/use-install-state";
import { INSTALL_APP_NS } from "../translations";
import { appUrl, useCopyAppLink } from "./use-copy-app-link";

type Variant = "ios" | "in-app" | "other";

type Step = { key: string; icon?: LucideIcon };

const STEPS: Record<Variant, Step[]> = {
	ios: [{ key: "stepIosShare", icon: Share }, { key: "stepIosAdd", icon: SquarePlus }, { key: "stepIosConfirm" }],
	"in-app": [{ key: "stepInAppCopy", icon: Copy }, { key: "stepInAppOpen" }, { key: "stepInAppInstall" }],
	other: [
		{ key: "stepOtherMenu", icon: EllipsisVertical },
		{ key: "stepOtherInstall", icon: SquarePlus },
	],
};

const HINTS: Record<Variant, string | null> = { ios: "hintIos", "in-app": null, other: "hintOther" };

type Props = {
	/** Сохранение резервной копии — экспорт живёт в другой фиче, поэтому его передаёт виджет. */
	onSaveBackup: () => void | Promise<void>;
};

/** Шторка (на десктопе — диалог) «Как установить»: шаги для платформы и, если нужно, перенос записей через копию. */
const InstallInstructionsSheet = NiceModal.create(({ onSaveBackup }: Props) => {
	const { t } = useTranslation(INSTALL_APP_NS);
	const modal = useModal();
	const state = useInstallState();
	const hasRecords = useHasRecords();
	const copyAppLink = useCopyAppLink();

	const variant: Variant = state.mode === "in-app" ? "in-app" : state.platform === "ios" ? "ios" : "other";
	const showMove = hasRecords && needsDataMove(state);
	const hint = HINTS[variant];

	const close = async () => {
		await modal.hide();
		modal.remove();
	};

	return (
		<Dialog open={modal.visible} onOpenChange={(open) => !open && void close()}>
			<DialogContent aria-describedby={undefined} className="gap-3.5 lg:max-w-[480px]">
				<div className="flex min-h-11 items-center gap-2">
					<DialogTitle className="flex-1 tracking-[-0.015em]">{t("sheetTitle")}</DialogTitle>
					<DialogClose asChild>
						<Button type="button" variant="secondary" size="icon" aria-label={t("close")} className="-mr-2 lg:-mr-3">
							<X className="size-5" aria-hidden="true" />
						</Button>
					</DialogClose>
				</div>

				{showMove ? (
					<>
						<section
							aria-labelledby="install-move-title"
							className="bg-accent-muted flex flex-col gap-3 rounded-[20px] p-4"
						>
							<div className="flex items-start gap-3">
								<span
									aria-hidden="true"
									className="bg-card text-accent flex size-9 shrink-0 items-center justify-center rounded-[12px]"
								>
									<Download className="size-5" />
								</span>
								<div className="flex min-w-0 flex-1 flex-col gap-1">
									<h3 id="install-move-title" className="text-base leading-[22px] font-semibold">
										{t("moveTitle")}
									</h3>
									<p className="text-accent-strong text-sm leading-5">{t("moveText")}</p>
								</div>
							</div>
							<Button type="button" variant="accent" className="text-[15px]" onClick={() => void onSaveBackup()}>
								<Download className="size-[18px]" aria-hidden="true" />
								{t("moveSave")}
							</Button>
						</section>
						<h3 className="text-caption text-muted-foreground mx-1 -mb-1 font-semibold">{t("moveThen")}</h3>
					</>
				) : null}

				<ol className="bg-secondary flex flex-col rounded-[20px] px-3.5 py-1">
					{STEPS[variant].map(({ key, icon: Icon }, index) => (
						<li
							key={key}
							className={cn("flex min-h-14 items-center gap-3 py-2", index > 0 && "border-border border-t")}
						>
							<span
								aria-hidden="true"
								className="bg-card flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold"
							>
								{index + 1}
							</span>
							<span className="min-w-0 flex-1 text-[15px] leading-[21px]">{t(key)}</span>
							{Icon ? (
								<span
									aria-hidden="true"
									className="bg-card text-accent ring-border flex size-9 shrink-0 items-center justify-center rounded-[10px] ring-1 ring-inset"
								>
									<Icon className="size-5" />
								</span>
							) : null}
						</li>
					))}
				</ol>

				{variant === "in-app" ? (
					<div className="ring-border flex min-h-12 items-center gap-2.5 rounded-[14px] px-3.5 text-[15px] leading-5 ring-1 ring-inset">
						<Link2 className="text-muted-foreground size-[18px] shrink-0" aria-hidden="true" />
						<span className="min-w-0 flex-1 break-all select-all">{appUrl()}</span>
					</div>
				) : null}

				{hint ? (
					<p className="text-caption text-muted-foreground mx-1 flex gap-2">
						<Info className="mt-px size-4 shrink-0" aria-hidden="true" />
						{t(hint)}
					</p>
				) : null}

				<div className="mt-1 flex flex-col gap-2 lg:flex-row lg:justify-end">
					{variant === "in-app" ? (
						<Button
							type="button"
							variant={showMove ? "secondary" : "accent"}
							size="lg"
							className="lg:h-11 lg:px-5 lg:text-[15px]"
							onClick={() => void copyAppLink()}
						>
							<Copy className="size-5" aria-hidden="true" />
							{t("copyLink")}
						</Button>
					) : (
						<DialogClose asChild>
							<Button
								type="button"
								variant="secondary"
								size="lg"
								className="font-medium lg:h-11 lg:px-6 lg:text-[15px]"
							>
								{t("sheetDone")}
							</Button>
						</DialogClose>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
});

export function showInstallInstructions(props: Props) {
	return NiceModal.show(InstallInstructionsSheet, props);
}
