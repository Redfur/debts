import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { computeGlobalTotals, useDebtStore } from "@/entities/debt";
import { PageHeader, ScreenBody } from "@/shared/layout";
import { useDisplayCurrency } from "@/shared/lib/currency-preference";
import { HOME_SCREEN_NS } from "../translations";
import { ContactList } from "./ContactList";
import { HomeDifferenceCard, HomeNetPosition } from "./HomeNetPosition";
import { HomeOnboarding } from "./HomeOnboarding";
import { TotalCard } from "./HomeTotalsCards";

export function HomeScreen() {
	const { t } = useTranslation(HOME_SCREEN_NS);
	const hydrated = useDebtStore((s) => s.hydrated);
	const debtsById = useDebtStore((s) => s.debtsById);
	const operationsByDebtId = useDebtStore((s) => s.operationsByDebtId);
	const ratesCache = useDebtStore((s) => s.ratesCache);
	const displayCurrency = useDisplayCurrency();

	if (!hydrated) return <HomeSkeleton />;

	if (Object.keys(debtsById).length === 0) {
		return (
			<ScreenBody className="flex-1">
				<PageHeader title={t("title")} />
				<HomeOnboarding />
			</ScreenBody>
		);
	}

	const totals = computeGlobalTotals(debtsById, operationsByDebtId, ratesCache, displayCurrency);

	return (
		<ScreenBody gap="compact">
			<PageHeader title={t("title")} className="mb-2" />
			<div className="grid gap-2 lg:grid-cols-[repeat(auto-fit,minmax(260px,1fr))] lg:gap-4">
				<TotalCard
					direction="owed_to_me"
					converted={totals.totalOwedToMeConverted}
					byCurrency={totals.owedToMeByCurrency}
					displayCurrency={displayCurrency}
				/>
				<TotalCard
					direction="i_owe"
					converted={totals.totalOwedByMeConverted}
					byCurrency={totals.owedByMeByCurrency}
					displayCurrency={displayCurrency}
				/>
				<HomeDifferenceCard
					owedToMe={totals.totalOwedToMeConverted}
					owedByMe={totals.totalOwedByMeConverted}
					displayCurrency={displayCurrency}
				/>
			</div>
			<HomeNetPosition
				owedToMe={totals.totalOwedToMeConverted}
				owedByMe={totals.totalOwedByMeConverted}
				displayCurrency={displayCurrency}
			/>
			<ContactList />
		</ScreenBody>
	);
}

/** Скелетон главной по форме экрана (карточки итогов, фильтр, список). */
function HomeSkeleton() {
	const { t } = useTranslation(HOME_SCREEN_NS);
	return (
		<ScreenBody variant="skeleton" gap="compact">
			<PageHeader title={t("title")} className="mb-2" />
			<span className="sr-only">{t("loading")}</span>
			<div className="grid gap-2 lg:grid-cols-3 lg:gap-4">
				<Skeleton className="bg-owed-to-me-muted h-[108px] rounded-card" />
				<Skeleton className="bg-i-owe-muted h-[108px] rounded-card" />
			</div>
			<Skeleton className="mx-1 my-2 h-2 rounded-full" />
			<div className="flex gap-1.5">
				<Skeleton className="h-11 w-20 rounded-full" />
				<Skeleton className="h-11 w-32 rounded-full" />
				<Skeleton className="h-11 w-28 rounded-full" />
			</div>
			<div className="bg-card shadow-card mt-1 flex flex-col rounded-card py-1">
				{[140, 100, 120, 90].map((w) => (
					<div key={w} className="flex items-center gap-3 px-4 py-3">
						<Skeleton className="size-[42px] rounded-full" />
						<Skeleton className="h-3.5 rounded-full" style={{ width: w }} />
						<Skeleton className="ml-auto h-[22px] w-[76px] rounded-chip" />
					</div>
				))}
			</div>
		</ScreenBody>
	);
}
