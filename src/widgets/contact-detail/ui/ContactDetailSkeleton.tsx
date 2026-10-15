import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { ScreenBody } from "@/shared/layout";
import { CONTACT_DETAIL_NS } from "../translations";

/** Скелетон карточки контакта по форме экрана. */
export function ContactDetailSkeleton() {
	const { t } = useTranslation(CONTACT_DETAIL_NS);
	return (
		<ScreenBody variant="skeleton" className="pt-[calc(env(safe-area-inset-top,0px)+64px)] lg:pt-9">
			<span className="sr-only">{t("loading")}</span>
			<div className="flex items-center gap-3.5">
				<Skeleton className="size-14 rounded-full" />
				<Skeleton className="h-[22px] w-44 rounded-full" />
			</div>
			<Skeleton className="h-13 rounded-full lg:hidden" />
			<div className="mt-1 grid grid-cols-2 gap-2 lg:grid-cols-3 lg:gap-4">
				<Skeleton className="bg-owed-to-me-muted h-[76px] rounded-[20px]" />
				<Skeleton className="bg-i-owe-muted h-[76px] rounded-[20px]" />
			</div>
			<Skeleton className="mx-1 h-2 rounded-full" />
			{[160, 190].map((w) => (
				<div key={w} className="bg-card shadow-card flex flex-col gap-3 rounded-card p-4">
					<div className="flex justify-between">
						<Skeleton className="h-[22px] w-26 rounded-full" />
						<Skeleton className="h-3 w-11 rounded-full" />
					</div>
					<Skeleton className="h-[18px] rounded-full" style={{ width: w }} />
					<Skeleton className="h-1.5 rounded-full" />
					<div className="flex gap-1.5">
						<Skeleton className="h-11 flex-1 rounded-full" />
						<Skeleton className="h-11 w-24 rounded-full" />
						<Skeleton className="h-11 w-22 rounded-full" />
					</div>
				</div>
			))}
		</ScreenBody>
	);
}
