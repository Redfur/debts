import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { COMMON_NS } from "@/shared/i18n";
import { ScreenBody } from "@/shared/layout";

/** Заглушки на время загрузки чанка экрана: повторяют раскладку экранов дизайн-системы. */

const HEADER = "mt-[calc(env(safe-area-inset-top,0px)+20px)] h-11 lg:mt-9";

function SkeletonRow() {
	return (
		<div className="flex min-h-14 items-center gap-3 px-4">
			<div className="flex flex-1 flex-col gap-1.5">
				<Skeleton className="h-3.5 w-32 rounded-full" />
				<Skeleton className="h-2.5 w-48 rounded-full" />
			</div>
			<Skeleton className="h-3.5 w-16 rounded-full" />
		</div>
	);
}

export function SettingsRouteFallback() {
	const { t } = useTranslation(COMMON_NS);
	return (
		<ScreenBody variant="skeleton" className="gap-5 lg:max-w-[960px]">
			<span className="sr-only">{t("loadingSettings")}</span>
			<div className={HEADER}>
				<Skeleton className="h-8 w-44 rounded-full" />
			</div>
			<div className="flex flex-col gap-2">
				<Skeleton className="mx-1 h-3 w-14 rounded-full" />
				<Skeleton className="h-13 w-full rounded-control" />
			</div>
			<div className="flex flex-col gap-2">
				<Skeleton className="mx-1 h-3 w-16 rounded-full" />
				<div className="bg-card shadow-card flex flex-col rounded-[20px] py-1">
					<SkeletonRow />
					<SkeletonRow />
				</div>
			</div>
			<div className="flex flex-col gap-2">
				<Skeleton className="mx-1 h-3 w-12 rounded-full" />
				<div className="bg-card shadow-card rounded-[20px] py-1">
					<SkeletonRow />
				</div>
			</div>
		</ScreenBody>
	);
}

export function ContactsRouteFallback() {
	const { t } = useTranslation(COMMON_NS);
	return (
		<ScreenBody variant="skeleton">
			<span className="sr-only">{t("loadingContacts")}</span>
			<div className={HEADER}>
				<Skeleton className="h-8 w-40 rounded-full" />
			</div>
			<Skeleton className="h-12 w-full rounded-[16px]" />
			<div className="bg-card shadow-card flex flex-col gap-1 rounded-card py-2 lg:max-w-[460px]">
				{[0, 1, 2, 3].map((i) => (
					<div key={i} className="flex min-h-16 items-center gap-3 px-4">
						<Skeleton className="size-[42px] rounded-full" />
						<Skeleton className="h-3.5 flex-1 rounded-full" />
						<Skeleton className="h-5 w-20 rounded-chip" />
					</div>
				))}
			</div>
		</ScreenBody>
	);
}

export function CreateDebtRouteFallback() {
	const { t } = useTranslation(COMMON_NS);
	return (
		<ScreenBody
			variant="skeleton"
			className="mx-auto w-full max-w-xl gap-3.5 pt-[calc(env(safe-area-inset-top,0px)+8px)]"
		>
			<span className="sr-only">{t("loadingCreateDebt")}</span>
			<div className="flex h-11 items-center justify-center">
				<Skeleton className="h-4 w-28 rounded-full" />
			</div>
			<Skeleton className="h-14 w-full rounded-control" />
			<div className="grid grid-cols-2 gap-2">
				<Skeleton className="h-15 rounded-control" />
				<Skeleton className="h-15 rounded-control" />
			</div>
			<Skeleton className="h-20 w-full rounded-card" />
			<Skeleton className="h-13 w-full rounded-control" />
		</ScreenBody>
	);
}

export function ContactDetailRouteFallback() {
	return (
		<ScreenBody variant="skeleton">
			<div className={HEADER} />
			<div className="flex items-center gap-3.5">
				<Skeleton className="size-14 rounded-full" />
				<Skeleton className="h-7 w-48 rounded-full" />
			</div>
			<div className="grid grid-cols-2 gap-3">
				<Skeleton className="h-24 rounded-card" />
				<Skeleton className="h-24 rounded-card" />
			</div>
			<Skeleton className="h-48 w-full rounded-card" />
		</ScreenBody>
	);
}
