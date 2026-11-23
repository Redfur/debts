import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDebtStore } from "@/entities/debt";
import { formatMoney } from "@/shared/lib/format-amount";
import { formatShortDate } from "@/shared/lib/format-date";
import { useLocalizationPreferences } from "@/shared/lib/localization-preference";
import { useModalClose } from "@/shared/lib/use-modal-close";
import { SETTLEMENT_DETAILS_NS } from "../translations";

const ContactSettlementDetails = NiceModal.create(
	({ settlementId, trigger }: { settlementId: string; trigger?: HTMLElement }) => {
		const { t } = useTranslation(SETTLEMENT_DETAILS_NS);
		useLocalizationPreferences();
		const modal = useModal();
		const { close, onCloseComplete } = useModalClose(modal);
		const settlement = useDebtStore((state) => state.settlementsById[settlementId]);
		return (
			<Dialog
				open={modal.visible}
				onOpenChange={(open) => {
					if (!open) void close();
				}}
				onCloseComplete={onCloseComplete}
			>
				<DialogContent
					className="gap-3"
					onCloseAutoFocus={(event) => {
						if (!trigger?.isConnected) return;
						event.preventDefault();
						trigger.focus({ preventScroll: true });
					}}
				>
					<DialogHeader>
						<DialogTitle>{t("title")}</DialogTitle>
						<DialogDescription>
							{settlement ? `${formatShortDate(settlement.createdAt)} · ${settlement.currency}` : t("unavailable")}
						</DialogDescription>
					</DialogHeader>
					{settlement ? <Details settlement={settlement} /> : null}
					<Button variant="secondary" onClick={() => void close()}>
						{t("close")}
					</Button>
				</DialogContent>
			</Dialog>
		);
	},
);

type Settlement = ReturnType<typeof useDebtStore.getState>["settlementsById"][string];

function Details({ settlement }: { settlement: Settlement }) {
	const { t } = useTranslation(SETTLEMENT_DETAILS_NS);
	const money = (cents: number) => formatMoney(cents / 100, settlement.currency);
	const net = settlement.owedToMeCents - settlement.iOweCents;
	const { transfer, remainder } = settlement;
	return (
		<div className="flex min-h-0 flex-col gap-3 overflow-y-auto overscroll-contain text-body-s">
			<div className="bg-secondary grid gap-1 rounded-control p-3">
				<span>
					{t("iOwe")}: {money(settlement.iOweCents)}
				</span>
				<span>
					{t("owedToMe")}: {money(settlement.owedToMeCents)}
				</span>
				<strong>{net === 0 ? t("even") : t(net < 0 ? "owing" : "due", { amount: money(Math.abs(net)) })}</strong>
			</div>
			<p>{transfer ? t(transfer.direction, { amount: money(transfer.cents) }) : t("noTransfer")}</p>
			<p className="font-semibold">
				{remainder
					? t(remainder.direction === "i_owe" ? "oweRemainder" : "dueRemainder", { amount: money(remainder.cents) })
					: t("noRemainder")}
			</p>
			<h3 className="font-semibold">{t("debts")}</h3>
			<ul className="flex flex-col gap-2">
				{settlement.debts.map((debt) => (
					<li key={debt.debtId} className="flex justify-between gap-2">
						<span className="min-w-0 break-words">{debt.label || t("untitled")}</span>
						<span className="shrink-0">
							{debt.direction === "i_owe" ? "−" : "+"}
							{money(debt.cents)}
						</span>
					</li>
				))}
			</ul>
		</div>
	);
}

export function showContactSettlementDetails(settlementId: string) {
	const trigger = document.activeElement;
	return NiceModal.show(ContactSettlementDetails, {
		settlementId,
		trigger: trigger instanceof HTMLElement && trigger !== document.body ? trigger : undefined,
	});
}
