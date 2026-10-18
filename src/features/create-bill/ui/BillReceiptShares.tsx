import { Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { fromCents, ME_REF, ParticipantAvatar, useParticipantName } from "@/entities/debt";
import { formatMoney } from "@/shared/lib/format-amount";
import { cn } from "@/shared/lib/utils";
import { describeParticipant } from "../model/describe-bill";
import type { BillFormApi } from "../model/use-bill-form";
import { CREATE_BILL_NS } from "../translations";
import { BillConsequencesBox, useOutcomeText } from "./BillOutcome";

/** «Позиция 3» / «Позиции 2 и 3» — номера незаполненных позиций. */
export function usePendingItemsText(): (pending: number[]) => string {
	const { t } = useTranslation(CREATE_BILL_NS);
	return (pending) => {
		const list =
			pending.length < 2
				? String(pending[0] ?? "")
				: t("listAnd", { head: pending.slice(0, -1).join(", "), last: pending[pending.length - 1] });
		return t(pending.length === 1 ? "pendingOne" : "pendingMany", { list });
	};
}

/**
 * «Доли» чека: участник, доля и подпись («переведёт вам», «вы переведёте», «оплата всего чека»…), строка
 * о незаполненных позициях, строки о людях без имени и неделимых копейках, сводка последствий. Считаются по
 * заполненным позициям; пока ни одной нет — не показываются.
 */
export function BillReceiptShares({ form }: { form: BillFormApi }) {
	const { t } = useTranslation(CREATE_BILL_NS);
	const nameOf = useParticipantName();
	const outcomeText = useOutcomeText();
	const pendingText = usePendingItemsText();
	const { state, shares, transfers, receipt } = form;
	if (!transfers || receipt.itemsCents <= 0) return null;
	const money = (cents: number) => formatMoney(fromCents(cents), state.currency);

	const captionOf = (ref: string, index: number): { text: string; tone: "in" | "out" | "muted" } => {
		if (ref === state.payerRef && ref !== ME_REF) return { text: t("sharesPayer"), tone: "muted" };
		if (shares.cents[index] === 0) {
			return { text: t(ref === ME_REF ? "sharesNoneMe" : "sharesNone"), tone: "muted" };
		}
		const parts = describeParticipant(ref, transfers);
		const first = parts[0].kind;
		return {
			text: parts.map(outcomeText).join(" · "),
			tone: first === "toMe" ? "in" : first === "fromMe" ? "out" : "muted",
		};
	};

	const rounded = shares.roundedUpRefs;
	const roundedOneName = shares.othersRoundedUp
		? t("roundedOneOthers")
		: rounded[0] === ME_REF
			? t("roundedOneMe")
			: nameOf(rounded[0]);
	const roundedNote =
		shares.leftoverCents === 0
			? null
			: shares.leftoverCents === 1
				? t("roundedOne", { name: roundedOneName })
				: t("roundedMany");

	return (
		<>
			<section className="bg-card shadow-card rounded-[22px] px-4 pt-1 pb-1.5">
				<h2 className="pt-3 pb-1 text-[17px] leading-6 font-semibold">{t("receiptShares")}</h2>
				<ul role="status" aria-live="polite">
					{state.participants.map(({ ref }, index) => {
						const caption = captionOf(ref, index);
						return (
							<li key={ref} className={cn("flex min-h-14 items-center gap-3 py-1.5", index > 0 && "border-t")}>
								<ParticipantAvatar participantRef={ref} className="size-8 text-[13px]" />
								<span className="flex min-w-0 flex-1 flex-col">
									<span className="text-body truncate font-medium">{nameOf(ref)}</span>
									<span
										className={cn(
											"text-caption",
											caption.tone === "in" && "text-owed-to-me-strong font-medium",
											caption.tone === "out" && "text-i-owe-strong font-medium",
											caption.tone === "muted" && "text-muted-foreground",
										)}
									>
										{caption.text}
									</span>
								</span>
								<span className="text-body shrink-0 font-semibold whitespace-nowrap tabular-nums">
									{money(shares.cents[index])}
								</span>
							</li>
						);
					})}
					{receipt.pendingItems.length > 0 ? (
						<li className="text-muted-foreground flex min-h-12 items-center gap-3 border-t">
							<span
								aria-hidden="true"
								className="border-muted-foreground/50 flex size-8 shrink-0 items-center justify-center rounded-full border-[1.5px] border-dashed"
							>
								<Clock className="size-4" strokeWidth={2} />
							</span>
							<span className="min-w-0 flex-1 text-sm">{pendingText(receipt.pendingItems)}</span>
						</li>
					) : null}
				</ul>
				{shares.othersCents > 0 ? (
					<p className="text-caption text-muted-foreground border-t py-2.5">
						{t("others", { amount: money(shares.othersCents) })}
					</p>
				) : null}
				{roundedNote ? <p className="text-caption text-muted-foreground border-t py-2.5">{roundedNote}</p> : null}
			</section>
			<BillConsequencesBox form={form} />
		</>
	);
}
