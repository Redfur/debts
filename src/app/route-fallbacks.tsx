import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { COMMON_NS } from "@/shared/i18n";
import { ScreenBody } from "@/shared/layout";

export function SettingsRouteFallback() {
	const { t } = useTranslation(COMMON_NS);
	return (
		<ScreenBody variant="skeleton">
			<span className="sr-only">{t("loadingSettings")}</span>
			<Skeleton className="h-8 w-48" />
			<Skeleton className="h-24 w-full rounded-lg" />
			<Skeleton className="h-24 w-full rounded-lg" />
			<Skeleton className="h-40 w-full rounded-lg" />
		</ScreenBody>
	);
}
