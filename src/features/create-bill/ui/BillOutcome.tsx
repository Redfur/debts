import { useTranslation } from "react-i18next";
import { ME_REF, useParticipantName } from "@/entities/debt";
import { formatMoney } from "@/shared/lib/format-amount";
import { describeConsequences, type ParticipantOutcome } from "../model/describe-bill";
import type { BillFormApi } from "../model/use-bill-form";
import { CREATE_BILL_NS } from "../translations";

/** Подпись под именем участника: «переведёт вам», «вы переведёте», «переводы с: …», «в расчёте», «моя доля, не долг». */
export function useOutcomeText(): (part: ParticipantOutcome) => string {
	const { t } = useTranslation(CREATE_BILL_NS);
	const nameOf = useParticipantName();
	return (part) => {
		switch (part.kind) {
			case "toMe":
				return t("captionToMe");
			case "fromMe":
				return t("captionFromMe");
			case "with":
				return t("captionWith", { names: part.refs.map(nameOf).join(", ") });
			case "settled":
				return t("captionSettled");
			case "myShare":
				return t("captionMyShare");
		}
	};
}

/** Сводка последствий: «Появятся N долгов» с перечнем или «Ваши долги не изменятся». */
export function BillConsequencesBox({ form }: { form: BillFormApi }) {
	const { t } = useTranslation(CREATE_BILL_NS);
	const nameOf = useParticipantName();
	const { transfers, draft, shares, state } = form;
	if (!transfers) return null;
	const { owedToMe, iOwe, hasOthers } = describeConsequences(transfers);
	const count = owedToMe.length + iOwe.length;
	const money = (amount: number) => formatMoney(amount, state.currency);

	const describe = (items: { ref: string; amount: number }[], sameKey: "summaryOwedToMeSame" | "summaryIOweSame") => {
		const same = items.length > 1 && items.every((item) => item.amount === items[0].amount);
		if (same) return t(sameKey, { names: items.map((i) => nameOf(i.ref)).join(", "), amount: money(items[0].amount) });
		const list = items.map((i) => t("summaryItem", { name: nameOf(i.ref), amount: money(i.amount) })).join(", ");
		return t(sameKey === "summaryOwedToMeSame" ? "summaryOwedToMe" : "summaryIOwe", { list });
	};

	if (count === 0) {
		const meIndex = draft.participants.findIndex((p) => p.ref === ME_REF);
		const meActive = meIndex >= 0 && (draft.participants[meIndex].paid > 0 || shares.inSplit[meIndex]);
		return (
			<div className="flex flex-col gap-0.5 rounded-[18px] px-4 py-3.5 shadow-[inset_0_0_0_1px_var(--border)]">
				<b className="text-[15px] leading-5 font-semibold">{t("summaryNone")}</b>
				<span className="text-sm">{t(meActive ? "summaryNoneInside" : "summaryNoneOutside")}</span>
			</div>
		);
	}

	const lines = [
		owedToMe.length > 0 ? describe(owedToMe, "summaryOwedToMeSame") : null,
		iOwe.length > 0 ? describe(iOwe, "summaryIOweSame") : null,
		hasOthers ? t("summaryOthers") : null,
	].filter((line) => line !== null);

	return (
		<div className="bg-accent-muted text-accent-strong flex flex-col gap-0.5 rounded-[18px] px-4 py-3.5">
			<b className="text-[15px] leading-5 font-semibold">
				{count === 1 ? t("summaryOneDebt") : t("summaryDebts", { count })}
			</b>
			<span className="text-sm">{lines.join(" ")}</span>
		</div>
	);
}
