import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { hydrateCreationDraft, useCreationDraftStore } from "@/entities/debt";
import { showDeleteCreationDraft } from "@/features/delete-creation-draft";
import { HOME_SCREEN_NS } from "../translations";

export function CreationDraftsSection() {
	const { t } = useTranslation(HOME_SCREEN_NS);
	const drafts = useCreationDraftStore();
	const kinds = (["debt", "bill"] as const).filter((kind) => drafts[kind].present || drafts[kind].readError);
	if (kinds.length === 0) return null;
	return (
		<section className="bg-card shadow-card flex flex-col gap-3 rounded-card p-4">
			<h2 className="text-heading">{t("draftsTitle")}</h2>
			{kinds.map((kind) => (
				<div key={kind} className="flex flex-wrap items-center justify-between gap-2">
					<span className="text-body-s">{t(kind === "debt" ? "draftDebt" : "draftBill")}</span>
					<div className="flex flex-wrap gap-2">
						<Button variant="secondary" asChild>
							<Link to={kind === "debt" ? "/new" : "/bills/new"}>{t("draftContinue")}</Link>
						</Button>
						<Button
							variant="destructive-ghost"
							disabled={drafts[kind].locked || !drafts[kind].ready}
							onClick={() => void showDeleteCreationDraft(kind)}
						>
							{t("draftDelete")}
						</Button>
					</div>
					{drafts[kind].readError ? (
						<p role="alert" className="text-caption text-destructive w-full">
							{t("draftReadError")}{" "}
							<Button variant="link" onClick={() => void hydrateCreationDraft(kind)}>
								{t("retry")}
							</Button>
						</p>
					) : null}
				</div>
			))}
		</section>
	);
}
