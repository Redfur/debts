import { ReceiptText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScreenBody } from "@/shared/layout";
import { EmptyState } from "@/shared/ui/empty-state";
import { BILL_DETAIL_NS } from "../translations";

/** «Счёт не найден» с кнопкой «На главную». */
export function BillNotFound() {
	const { t } = useTranslation(BILL_DETAIL_NS);
	return (
		<ScreenBody className="flex-1 justify-center pt-[calc(env(safe-area-inset-top,0px)+20px)]">
			<EmptyState
				icon={<ReceiptText />}
				title={t("notFoundTitle")}
				description={t("notFoundBody")}
				actions={
					<Link to="/" className={buttonVariants({ size: "lg" })}>
						{t("toHome")}
					</Link>
				}
			/>
		</ScreenBody>
	);
}

/** Скелетон экрана счёта, пока данные читаются с устройства. */
export function BillDetailSkeleton() {
	const { t } = useTranslation(BILL_DETAIL_NS);
	return (
		<ScreenBody variant="skeleton" className="gap-4 lg:max-w-[1080px]">
			<span className="sr-only">{t("loading")}</span>
			<div className="mt-[calc(env(safe-area-inset-top,0px)+20px)] h-11 lg:mt-9" />
			<Skeleton className="h-8 w-40 rounded-full" />
			<div className="grid gap-4 lg:grid-cols-2">
				<div className="flex flex-col gap-4">
					<Skeleton className="h-36 w-full rounded-card" />
					<Skeleton className="h-44 w-full rounded-card" />
				</div>
				<Skeleton className="h-56 w-full rounded-card" />
			</div>
		</ScreenBody>
	);
}
