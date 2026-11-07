import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { i18n } from "@/shared/lib/i18n";
import type { CreationDraftKind } from "@/shared/lib/storage";
import { cn } from "@/shared/lib/utils";
import { showConfirmActionModal } from "@/shared/ui/modals/ConfirmActionModal";
import {
	flushCreationDraft,
	hydrateCreationDraft,
	retryCreationDraft,
	useCreationDraftStore,
} from "../model/creation-drafts/creation-draft-store";
import { ENTITY_DEBT_NS } from "../translations";

export function CreationDraftGate({
	kind,
	onBack,
	onDelete,
	children,
}: {
	kind: CreationDraftKind;
	onBack: () => void;
	onDelete: () => void;
	children: ReactNode;
}) {
	const { t } = useTranslation(ENTITY_DEBT_NS);
	const ready = useCreationDraftStore((s) => s[kind].ready);
	const error = useCreationDraftStore((s) => s[kind].readError);
	if (!ready)
		return (
			<p role="status" className="text-body text-muted-foreground py-6">
				{t("draftLoading")}
			</p>
		);
	if (!error) return children;
	return (
		<div className="mx-auto flex max-w-xl flex-col gap-3 py-6">
			<p role="alert" className="text-body text-destructive">
				{t("draftReadError")}
			</p>
			<Button onClick={() => void hydrateCreationDraft(kind)}>{t("draftRetry")}</Button>
			<Button variant="destructive-soft" onClick={onDelete}>
				{t("draftDelete")}
			</Button>
			<Button variant="secondary" onClick={onBack}>
				{t("draftBack")}
			</Button>
		</div>
	);
}

export function CreationDraftStatus({ kind, onDelete }: { kind: CreationDraftKind; onDelete: () => void }) {
	const { t } = useTranslation(ENTITY_DEBT_NS);
	const current = useCreationDraftStore((s) => s[kind]);
	return (
		<div
			className={cn(
				"flex flex-col gap-0.5 rounded-[18px] px-4 py-3.5 shadow-[inset_0_0_0_1px_var(--border)]",
				!current.present && "invisible",
			)}
		>
			<div className="flex min-h-11 items-center justify-between gap-2">
				<div role="status" aria-live="polite" className="min-w-0 truncate text-[15px] leading-5 font-semibold">
					{current.status === "saving" ? t("draftSaving") : current.status === "saved" ? t("draftSaved") : null}
				</div>
				<Button
					type="button"
					variant="destructive-ghost"
					size="sm"
					disabled={!current.present || current.locked}
					className={cn("text-caption h-11 shrink-0 px-2", !current.present && "invisible")}
					onClick={onDelete}
				>
					{t("draftDelete")}
				</Button>
			</div>
			{current.status !== "error" ? <p className="text-muted-foreground text-sm">{t("draftHint")}</p> : null}
			{current.status === "error" ? (
				<div role="alert" className="text-caption text-destructive">
					{t("draftSaveError")}{" "}
					<Button type="button" variant="link" disabled={current.locked} onClick={() => retryCreationDraft(kind)}>
						{t("draftRetry")}
					</Button>
				</div>
			) : null}
		</div>
	);
}

export async function leaveCreationDraft(kind: CreationDraftKind, leave: () => void) {
	if (useCreationDraftStore.getState()[kind].locked) return;
	if (await flushCreationDraft(kind)) {
		leave();
		return;
	}
	const t = (key: string) => i18n.t(key, { ns: ENTITY_DEBT_NS });
	await showConfirmActionModal({
		title: t("draftLeaveTitle"),
		body: t("draftLeaveBody"),
		confirmLabel: t("draftLeave"),
		cancelLabel: t("draftStay"),
		onConfirm: leave,
	});
}
