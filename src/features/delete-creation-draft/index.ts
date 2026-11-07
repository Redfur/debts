import { toast } from "sonner";
import { type CreationDraftKind, deleteCreationDraft } from "@/entities/debt";
import { i18n, injectTranslation } from "@/shared/lib/i18n";
import { showConfirmActionModal } from "@/shared/ui/modals/ConfirmActionModal";
import { DELETE_CREATION_DRAFT_NS, translations } from "./translations";

injectTranslation(DELETE_CREATION_DRAFT_NS, translations);

export function showDeleteCreationDraft(kind: CreationDraftKind, onDeleted?: () => void) {
	const t = (key: string) => i18n.t(key, { ns: DELETE_CREATION_DRAFT_NS });
	return showConfirmActionModal({
		title: t("title"),
		body: t("body"),
		confirmLabel: t("confirm"),
		cancelLabel: t("cancel"),
		confirmVariant: "destructive",
		onConfirm: async () => {
			if (await deleteCreationDraft(kind)) onDeleted?.();
			else toast.error(t("error"));
		},
	});
}
