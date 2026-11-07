import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { i18n } from "@/shared/lib/i18n";
import type { CreationDraftKind } from "@/shared/lib/storage";
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

export function CreationDraftStatus({
	kind,
	restored,
	onDelete,
}: {
	kind: CreationDraftKind;
	restored: boolean;
	onDelete: () => void;
}) {
	const { t } = useTranslation(ENTITY_DEBT_NS);
	const current = useCreationDraftStore((s) => s[kind]);
	return (
		<div className="flex flex-col gap-1.5">
			{restored ? (
				<p className="text-caption text-muted-foreground">
					{t(kind === "debt" ? "draftContinueDebt" : "draftContinueBill")}
				</p>
			) : null}
			<div role="status" aria-live="polite" className="text-caption text-muted-foreground">
				{current.status === "saving" ? t("draftSaving") : current.status === "saved" ? t("draftSaved") : null}
			</div>
			{current.status === "error" ? (
				<div role="alert" className="text-caption text-destructive">
					{t("draftSaveError")}{" "}
					<Button type="button" variant="link" disabled={current.locked} onClick={() => retryCreationDraft(kind)}>
						{t("draftRetry")}
					</Button>
				</div>
			) : null}
			{current.present ? (
				<Button
					type="button"
					variant="destructive-ghost"
					disabled={current.locked}
					className="self-start"
					onClick={onDelete}
				>
					{t("draftDelete")}
				</Button>
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
