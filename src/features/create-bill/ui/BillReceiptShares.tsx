import { useTranslation } from "react-i18next";
import { fromCents, ME_REF, ParticipantAvatar, useParticipantName } from "@/entities/debt";
import { formatMoney } from "@/shared/lib/format-amount";
import { cn } from "@/shared/lib/utils";
import { describeParticipant } from "../model/describe-bill";
import type { BillFormApi } from "../model/use-bill-form";
import { CREATE_BILL_NS } from "../translations";
import { BillConsequencesBox, useOutcomeText } from "./BillOutcome";

/**
 * «Доли» чека: участник, доля и подпись («переведёт вам», «вы переведёте», «оплата всего чека»…),
 * строки о людях без имени и неделимых копейках, сводка последствий. Пока позиции не заполнены — не показывается.
 */
export function BillReceiptShares({ form }: { form: BillFormApi }) {
	const { t } = useTranslation(CREATE_BILL_NS);
	const nameOf = useParticipantName();
	const outcomeText = useOutcomeText();
	const { state, shares, transfers } = form;
	if (!transfers) return null;
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
	const roundedNote =
		rounded.length === 0
			? null
			: shares.leftoverCents === 1
				? t("roundedOne", { name: rounded[0] === ME_REF ? t("roundedOneMe") : nameOf(rounded[0]) })
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
