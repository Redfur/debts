import { useTranslation } from "react-i18next";
import { PageHeader, PageHeaderBackLink, ScreenBody } from "@/shared/layout";
import { CONTACT_DETAIL_NS } from "../translations";

export function ContactNotFound() {
	const { t } = useTranslation(CONTACT_DETAIL_NS);
	return (
		<ScreenBody gap="comfortable">
			<PageHeader leading={<PageHeaderBackLink to="/" ariaLabel={t("backToHome")} />} title={t("notFoundTitle")} />
			<p className="text-muted-foreground text-sm">{t("notFoundBody")}</p>
		</ScreenBody>
	);
}
