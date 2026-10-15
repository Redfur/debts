import { Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { EmptyState } from "@/shared/ui/empty-state";
import { CONTACTS_SCREEN_NS } from "../translations";

/** Правая колонка раздела «Контакты» на десктопе, пока контакт не выбран. */
export function ContactsSelectionPlaceholder() {
	const { t } = useTranslation(CONTACTS_SCREEN_NS);
	return <EmptyState className="pt-32" icon={<Users />} title={t("selectTitle")} description={t("selectHint")} />;
}
