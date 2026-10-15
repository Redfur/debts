import { UserX } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { ScreenBody } from "@/shared/layout";
import { EmptyState } from "@/shared/ui/empty-state";
import { CONTACT_DETAIL_NS } from "../translations";

export function ContactNotFound() {
	const { t } = useTranslation(CONTACT_DETAIL_NS);
	return (
		<ScreenBody className="flex-1 justify-center pt-[calc(env(safe-area-inset-top,0px)+20px)]">
			<EmptyState
				icon={<UserX />}
				title={t("notFoundTitle")}
				description={t("notFoundBody")}
				actions={
					<Link to="/" className={buttonVariants({ size: "lg" })}>
						{t("backToHome")}
					</Link>
				}
			/>
		</ScreenBody>
	);
}
