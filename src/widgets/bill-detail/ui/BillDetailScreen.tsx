import { ChevronLeft, Info } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, buttonVariants } from "@/components/ui/button";
import {
	type Bill,
	BillStatusBadge,
	type BillTransfer,
	computeBillShares,
	computeBillStatus,
	computeBillTransfers,
	computeDebtBalance,
	type Debt,
	ME_REF,
	ParticipantAvatar,
	TransferList,
	useBillDebts,
	useDebtStore,
	useParticipantName,
} from "@/entities/debt";
import { showDeleteBillConfirm } from "@/features/delete-bill";
import { ToggleBillClosedButton } from "@/features/toggle-bill-closed";
import { COMMON_NS } from "@/shared/i18n";
import { PageHeader, PageHeaderBackLink, ScreenBody } from "@/shared/layout";
import { formatAmount, formatMoney } from "@/shared/lib/format-amount";
import { formatShortDate } from "@/shared/lib/format-date";
import { roundAmount } from "@/shared/lib/round-amount";
import { cn } from "@/shared/lib/utils";
import { BILL_DETAIL_NS } from "../translations";

type Props = {
	bill: Bill;
	/** Куда ведёт «назад»: откуда открыли экран, по прямой ссылке — на главную. */
	backTo: string;
};

const MODE_KEYS = { equal: "modeEqual", shares: "modeShares", amounts: "modeAmounts" } as const;

/** Перевод с «Я» ↔ долг пользователя по контакту и направлению (в минимальной схеме — не больше одного). */
function findDebt(transfer: BillTransfer, debts: Debt[]): Debt | undefined {
	if (transfer.to === ME_REF) return debts.find((d) => d.contactId === transfer.from && d.direction === "owed_to_me");
	if (transfer.from === ME_REF) return debts.find((d) => d.contactId === transfer.to && d.direction === "i_owe");
	return undefined;
}

/**
 * Экран счёта — он же «скриншот для чата»: итог, «Кто кому переводит» (группы по отправителю или получателю,
 * мои переводы — с ролью направления и «✓ погашен»), участники с оплатой и долей, пояснение о статусе,
 * «Закрыть / Открыть счёт» и «Удалить счёт».
 */
export function BillDetailScreen({ bill, backTo }: Props) {
	const { t } = useTranslation(BILL_DETAIL_NS);
	const { t: tCommon } = useTranslation(COMMON_NS);
	const location = useLocation();
	const navigate = useNavigate();
	const nameOf = useParticipantName();
	const debts = useBillDebts(bill.id);
	const operationsByDebtId = useDebtStore((s) => s.operationsByDebtId);

	const transfers = useMemo(() => computeBillTransfers(bill) ?? [], [bill]);
	const shares = useMemo(() => computeBillShares(bill), [bill]);
	const status = computeBillStatus(bill, debts);
	const closed = status.status === "closed";
	const money = (amount: number) => formatMoney(amount, bill.currency);

	const payers = bill.participants
		.filter((p) => p.paid > 0)
		.map((p) => (p.ref === ME_REF ? t("payersMe") : nameOf(p.ref)));
	const meta = t("meta", {
		date: formatShortDate(bill.createdAt),
		payers: payers.join(", "),
		mode: t(MODE_KEYS[bill.splitMode]),
		people: t("participantsCount", { count: bill.participants.length }),
	});

	const principal = roundAmount(debts.reduce((acc, d) => acc + d.principalAmount, 0));
	const returned = roundAmount(
		debts.reduce((acc, d) => acc + d.principalAmount - computeDebtBalance(d, operationsByDebtId[d.id] ?? []), 0),
	);

	const myTransfers = transfers.filter((tr) => tr.from === ME_REF || tr.to === ME_REF);
	const hasOthers = transfers.length > myTransfers.length;
	const note = (() => {
		if (status.hasMyDebts) {
			if (closed) return t("noteClosedAuto", { date: formatShortDate(status.closedAt ?? bill.updatedAt) });
			if (hasOthers && myTransfers.length === 1) return t("noteOneOfMany");
			return debts.every((d) => d.direction === "i_owe") ? t("noteIOwe") : t("noteOwedToMe");
		}
		return closed
			? t("noteClosedManual", { date: formatShortDate(status.closedAt ?? bill.updatedAt) })
			: t("noteWithoutMe");
	})();

	const linkState = location.state;
	const editHref = `/bills/${bill.id}/edit`;
	const handleDelete = () => showDeleteBillConfirm({ bill, onDeleted: () => navigate("/", { replace: true }) });
	const title = bill.title ?? t("untitled");

	return (
		<ScreenBody className="gap-4 lg:max-w-[1080px] lg:gap-5">
			<PageHeader
				leading={
					<>
						<PageHeaderBackLink to={backTo} ariaLabel={tCommon("back")} className="lg:hidden" />
						<Link
							to={backTo}
							className="text-muted-foreground hover:text-foreground hidden min-h-11 items-center gap-1 rounded-md pr-1 text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-ring lg:flex"
						>
							<ChevronLeft className="size-5" strokeWidth={2.2} aria-hidden="true" />
							{backTo === "/" ? t("home") : tCommon("back")}
						</Link>
					</>
				}
				title={
					<span className="flex flex-wrap items-center gap-x-3 gap-y-1">
						<span className="break-words">{title}</span>
						<BillStatusBadge closed={closed} className="hidden lg:inline-flex" />
					</span>
				}
				actions={
					<>
						<Link
							to={editHref}
							state={linkState}
							className={cn(buttonVariants({ variant: "secondary" }), "bg-card shadow-card")}
						>
							{tCommon("edit")}
						</Link>
						<Button type="button" variant="destructive-soft" className="hidden lg:inline-flex" onClick={handleDelete}>
							{t("delete")}
						</Button>
					</>
				}
			/>

			<div className="grid gap-4 lg:grid-cols-2 lg:items-start lg:gap-5">
				<div className="flex flex-col gap-4 lg:gap-5">
					<section
						aria-label={t("summaryLabel")}
						className="bg-card shadow-card flex flex-col gap-2 rounded-card p-5 lg:p-6"
					>
						<BillStatusBadge closed={closed} className="self-start lg:hidden" />
						<span className="text-amount-xl tabular-nums">{money(bill.totalAmount)}</span>
						<span className="text-muted-foreground text-[15px] leading-[22px]">{meta}</span>
						{status.hasMyDebts ? (
							<div className="mt-2.5 flex flex-col gap-2 border-t pt-3.5">
								<div className="flex justify-between gap-2 text-sm">
									<span className="text-muted-foreground">{t("returned")}</span>
									<b className="font-semibold tabular-nums">
										{t("ofTotal", { done: formatAmount(returned), total: money(principal) })}
									</b>
								</div>
								<div
									role="img"
									aria-label={t("returnedA11y", { done: money(returned), total: money(principal) })}
									className="bg-secondary flex h-1.5 overflow-hidden rounded-full"
								>
									<span
										className="bg-owed-to-me rounded-full"
										style={{ width: `${principal > 0 ? (returned / principal) * 100 : 0}%` }}
									/>
								</div>
							</div>
						) : null}
					</section>

					<section className="bg-card shadow-card rounded-card px-5 pt-2 pb-2.5 lg:px-6">
						<h2 className="text-heading pt-3 pb-1">
							{t("transfers")}{" "}
							{transfers.length > 0 ? (
								<span className="text-muted-foreground font-medium">{transfers.length}</span>
							) : null}
						</h2>
						{transfers.length === 0 ? (
							<p className="flex flex-col gap-0.5 pb-3">
								<span className="text-body font-medium">{t("noTransfersTitle")}</span>
								<span className="text-caption text-muted-foreground">{t("noTransfersBody")}</span>
							</p>
						) : (
							<div className="pt-1">
								<TransferList
									transfers={transfers}
									currency={bill.currency}
									isRepaid={(tr) => findDebt(tr, debts)?.status === "closed"}
								/>
							</div>
						)}
					</section>
				</div>

				<div className="flex flex-col gap-4 lg:gap-5">
					<section className="bg-card shadow-card rounded-card px-5 pt-2 pb-2.5 lg:px-6">
						<h2 className="text-heading pt-3 pb-1">
							{t("participants")} <span className="text-muted-foreground font-medium">{bill.participants.length}</span>
						</h2>
						<ul>
							{bill.participants.map((p, index) => {
								const parts = [
									p.paid > 0 ? t("paidPart", { amount: money(p.paid) }) : null,
									shares.inSplit[index]
										? bill.splitMode === "shares"
											? t("sharePartShares", { amount: money(shares.cents[index] / 100), count: p.shareInput ?? 0 })
											: t("sharePart", { amount: money(shares.cents[index] / 100) })
										: null,
								].filter((part) => part !== null);
								return (
									<li key={p.ref} className={cn("flex min-h-14 items-center gap-3 py-2", index > 0 && "border-t")}>
										<ParticipantAvatar participantRef={p.ref} className="size-9 text-sm" />
										<span className="flex min-w-0 flex-1 flex-col">
											<span className="text-body font-medium break-words">{nameOf(p.ref)}</span>
											<span className="text-caption text-muted-foreground">
												{parts.length > 0 ? parts.join(" · ") : t(p.ref === ME_REF ? "notSplittingMe" : "notSplitting")}
											</span>
										</span>
									</li>
								);
							})}
						</ul>
					</section>

					<p className="text-caption text-muted-foreground mx-1 flex gap-2">
						<Info className="mt-px size-4 shrink-0" aria-hidden="true" />
						{note}
					</p>

					<div className="flex flex-col gap-2">
						{status.hasMyDebts ? null : <ToggleBillClosedButton billId={bill.id} closed={closed} />}
						<Button
							type="button"
							variant="destructive-soft"
							size="lg"
							className="w-full lg:hidden"
							onClick={handleDelete}
						>
							{t("delete")}
						</Button>
					</div>
				</div>
			</div>
		</ScreenBody>
	);
}
