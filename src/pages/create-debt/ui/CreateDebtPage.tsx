import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CREATE_DEBT_NS, CreateDebtForm } from "@/features/create-debt";
import { COMMON_NS } from "@/shared/i18n";
import { PageHeader, PageHeaderBackLink, ScreenBody } from "@/shared/layout";

export function CreateDebtPage() {
	const { t } = useTranslation(CREATE_DEBT_NS);
	const { t: tCommon } = useTranslation(COMMON_NS);
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const contactId = searchParams.get("contactId") ?? undefined;
	const backTo = contactId ? `/contacts/${contactId}` : "/";

	return (
		<ScreenBody gap="comfortable">
			<PageHeader leading={<PageHeaderBackLink to={backTo} ariaLabel={tCommon("back")} />} title={t("title")} />
			<CreateDebtForm
				initialContactId={contactId}
				onSuccess={() => navigate(backTo)}
				onCancel={() => navigate(backTo)}
			/>
		</ScreenBody>
	);
}
