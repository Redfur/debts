import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebtStore } from "@/entities/debt";
import { PageHeader, ScreenBody } from "@/shared/layout";
import { HOME_SCREEN_NS } from "../translations";
import { ContactList } from "./ContactList";
import { HomeTotalsCards } from "./HomeTotalsCards";

export function HomeScreen() {
	const { t } = useTranslation(HOME_SCREEN_NS);
	const hydrated = useDebtStore((s) => s.hydrated);

	if (!hydrated) {
		return (
			<ScreenBody variant="skeleton">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-24 w-full rounded-lg" />
				<Skeleton className="h-40 w-full rounded-lg" />
			</ScreenBody>
		);
	}

	return (
		<ScreenBody gap="comfortable">
			<PageHeader
				title={t("title")}
				actions={
					<Button type="button" asChild>
						<Link to="/new">
							<Plus />
							{t("addDebtAction")}
						</Link>
					</Button>
				}
			/>

			<HomeTotalsCards />

			<div className="flex flex-col gap-3">
				<h2 className="text-muted-foreground text-sm font-medium">{t("contactsSectionTitle")}</h2>
				<ContactList />
			</div>
		</ScreenBody>
	);
}
