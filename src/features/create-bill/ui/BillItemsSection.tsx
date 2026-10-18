import { Plus, Trash2 } from "lucide-react";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import { AmountInput } from "@/components/ui/amount-input";
import { Input } from "@/components/ui/input";
import { ME_REF, toCents, useParticipantName } from "@/entities/debt";
import { CURRENCY_SYMBOL } from "@/shared/config/currencies";
import { formatMoney } from "@/shared/lib/format-amount";
import { cn } from "@/shared/lib/utils";
import { type BillFormApi, type FormItem, itemIssue } from "../model/use-bill-form";
import { CREATE_BILL_NS } from "../translations";
import { BillPeopleChips } from "./BillPeopleChips";

type Props = {
	form: BillFormApi;
	/** После погашений: позиции только для чтения, видны только отмеченные. */
	locked: boolean;
	/** Подзаголовок блока прячется на десктопе: там он — заголовок колонки. */
	hideLabelOnDesktop?: boolean;
};

const ISSUE_KEYS = { price: "itemNeedPrice", people: "itemNeedPeople", both: "itemNeedBoth" } as const;

/** «Позиции · N»: строки чека с ценой, отметками участников и людьми без имени, «Добавить позицию». */
export function BillItemsSection({ form, locked, hideLabelOnDesktop }: Props) {
	const { t } = useTranslation(CREATE_BILL_NS);
	const labelId = useId();
	const { state } = form;

	return (
		<div className="flex flex-col gap-2.5">
			<span
				id={labelId}
				className={cn("text-caption text-muted-foreground pl-1 font-semibold", hideLabelOnDesktop && "lg:sr-only")}
			>
				{t("items", { count: state.items.length })}
			</span>
			<ul aria-labelledby={labelId} className="flex flex-col gap-2.5">
				{state.items.map((item, index) => (
					<ItemRow key={item.id} form={form} item={item} index={index} locked={locked} />
				))}
			</ul>
			{locked ? null : (
				<button
					type="button"
					onClick={form.addItem}
					className="border-muted-foreground/50 text-accent flex min-h-13 items-center justify-center gap-1.5 rounded-[18px] border-[1.5px] border-dashed text-[15px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					<Plus className="size-[18px]" strokeWidth={2.4} aria-hidden="true" />
					{t("addItem")}
				</button>
			)}
		</div>
	);
}

type RowProps = { form: BillFormApi; item: FormItem; index: number; locked: boolean };

function ItemRow({ form, item, index, locked }: RowProps) {
	const { t } = useTranslation(CREATE_BILL_NS);
	const nameOf = useParticipantName();
	const titleId = useId();
	const priceId = useId();
	const { state, receipt } = form;
	const title = item.title.trim() || t("itemUntitled");
	const people = item.refs.length + item.extraPeople;
	const priceCents = toCents(Number(item.price) || 0);
	const issue = itemIssue(item);
	const blank = !issue && (priceCents <= 0 || people === 0);
	// «по X» — уже со скидкой: позиции уменьшаются пропорционально цене.
	const keptShare = receipt.itemsCents > 0 ? (receipt.itemsCents - receipt.discountCents) / receipt.itemsCents : 1;
	const money = (cents: number) => formatMoney(Math.round(cents) / 100, state.currency);
	const caption = issue
		? t(ISSUE_KEYS[issue])
		: blank
			? t("itemNeedBoth")
			: people === 1
				? t("itemOnePerson", { amount: money(priceCents * keptShare) })
				: t("itemPerPerson", { amount: money((priceCents * keptShare) / people), count: people });
	const fieldClass = cn(
		"flex min-h-12 items-center rounded-[14px] px-3 focus-within:shadow-[inset_0_0_0_2px_var(--ring)]",
		locked ? "shadow-[inset_0_0_0_1px_var(--border)]" : "bg-(--field-bg,var(--background))",
	);

	return (
		<li
			className={cn(
				"flex flex-col gap-2.5 rounded-[22px] p-3.5",
				locked ? "shadow-[inset_0_0_0_1px_var(--border)]" : "bg-card shadow-card",
			)}
		>
			<div className="flex items-center gap-2">
				<div className={cn(fieldClass, "min-w-0 flex-1")}>
					<label htmlFor={titleId} className="sr-only">
						{t("itemTitleLabel", { n: index + 1 })}
					</label>
					<Input
						id={titleId}
						value={item.title}
						onChange={(e) => form.setItemTitle(item.id, e.target.value)}
						placeholder={t("itemTitlePlaceholder")}
						disabled={locked}
						enterKeyHint="next"
						className="h-auto min-h-0 rounded-none bg-transparent px-0 text-base font-medium shadow-none focus-visible:shadow-none disabled:bg-transparent disabled:shadow-none"
					/>
				</div>
				<div className={cn(fieldClass, "w-[118px] shrink-0 gap-1")}>
					<label htmlFor={priceId} className="sr-only">
						{t("itemPriceLabel", { n: index + 1 })}
					</label>
					<AmountInput
						id={priceId}
						value={item.price}
						onValueChange={(raw) => form.setItemPrice(item.id, raw)}
						placeholder="0"
						disabled={locked}
						className="h-auto min-h-0 min-w-0 flex-1 bg-transparent px-0 text-right text-[17px] font-semibold shadow-none focus-visible:shadow-none disabled:bg-transparent disabled:shadow-none disabled:text-muted-foreground"
					/>
					<span className="text-muted-foreground font-semibold">{CURRENCY_SYMBOL[state.currency]}</span>
				</div>
			</div>

			<BillPeopleChips
				participantRefs={state.participants.map((p) => p.ref)}
				refs={item.refs}
				extraPeople={item.extraPeople}
				groupLabel={t("itemGroup", { title })}
				chipLabel={(ref, on) =>
					ref === ME_REF
						? t(on ? "itemSplitsMe" : "itemNotSplitsMe", { title })
						: t(on ? "itemSplits" : "itemNotSplits", { name: nameOf(ref), title })
				}
				onToggle={(ref) => form.toggleItemRef(item.id, ref)}
				onExtraPeople={(count) => form.setItemExtraPeople(item.id, count)}
				locked={locked}
			/>

			<div className="flex h-5 items-center justify-between gap-2">
				<span
					role="status"
					className={cn("text-caption min-w-0 truncate", issue ? "text-warning font-medium" : "text-muted-foreground")}
				>
					{caption}
				</span>
				{locked ? null : (
					<button
						type="button"
						aria-label={t("removeItem", { title })}
						onClick={() => form.removeItem(item.id)}
						className="text-muted-foreground hover:text-foreground -my-3 -mr-2.5 flex size-11 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						<Trash2 className="size-[18px]" strokeWidth={2} />
					</button>
				)}
			</div>
		</li>
	);
}
