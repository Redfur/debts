import { Check, Minus, Plus, Trash2 } from "lucide-react";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import { AmountInput } from "@/components/ui/amount-input";
import { Input } from "@/components/ui/input";
import { MAX_EXTRA_PEOPLE, ME_REF, toCents, useParticipantName } from "@/entities/debt";
import { CURRENCY_SYMBOL } from "@/shared/config/currencies";
import { formatMoney } from "@/shared/lib/format-amount";
import { cn } from "@/shared/lib/utils";
import { type BillFormApi, type FormItem, itemIssue } from "../model/use-bill-form";
import { CREATE_BILL_NS } from "../translations";

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
	const { state } = form;
	const title = item.title.trim() || t("itemUntitled");
	const people = item.refs.length + item.extraPeople;
	const priceCents = toCents(Number(item.price) || 0);
	const issue = itemIssue(item);
	const money = (cents: number) => formatMoney(cents / 100, state.currency);
	const caption = issue
		? t(ISSUE_KEYS[issue])
		: people === 1
			? t("itemOnePerson", { amount: money(priceCents) })
			: people > 1
				? t("itemPerPerson", { amount: money(Math.round(priceCents / people)), count: people })
				: null;
	const chips = locked ? state.participants.filter((p) => item.refs.includes(p.ref)) : state.participants;
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

			<fieldset aria-label={t("itemGroup", { title })} className="m-0 flex min-w-0 flex-wrap gap-1.5 border-0 p-0">
				{chips.map(({ ref }) => {
					const on = item.refs.includes(ref);
					const me = ref === ME_REF;
					const name = nameOf(ref);
					const label = me
						? t(on ? "itemSplitsMe" : "itemNotSplitsMe", { title })
						: t(on ? "itemSplits" : "itemNotSplits", { name, title });
					if (locked) {
						return (
							<span
								key={ref}
								className="text-muted-foreground inline-flex min-h-9 max-w-full items-center rounded-full px-3 text-sm font-medium shadow-[inset_0_0_0_1px_var(--border)]"
							>
								<span className="max-w-[120px] truncate">{name.split(" ")[0]}</span>
							</span>
						);
					}
					return (
						<button
							key={ref}
							type="button"
							aria-pressed={on}
							aria-label={label}
							onClick={() => form.toggleItemRef(item.id, ref)}
							className={cn(
								"inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-full text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-ring",
								on
									? "bg-accent-muted text-accent-strong pr-3.5 pl-2.5 font-semibold shadow-[inset_0_0_0_1.5px_var(--accent)]"
									: "bg-(--field-bg,var(--background)) px-3.5 font-medium",
							)}
						>
							{on ? <Check className="size-[15px]" strokeWidth={3} aria-hidden="true" /> : null}
							<span className="max-w-[120px] truncate">{name.split(" ")[0]}</span>
						</button>
					);
				})}
				<ExtraPeople form={form} item={item} locked={locked} />
			</fieldset>

			<div className="flex min-h-5 items-center justify-between gap-2">
				<span className={cn("text-caption text-muted-foreground", issue && "font-medium")}>{caption}</span>
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

/** «+ ещё» без людей без имени; со счётчиком — «− + ещё N +»; в неактивной форме — только «+ ещё N». */
function ExtraPeople({ form, item, locked }: { form: BillFormApi; item: FormItem; locked: boolean }) {
	const { t } = useTranslation(CREATE_BILL_NS);
	const count = item.extraPeople;
	const text = t("extraCount", { count });
	if (locked) {
		return count > 0 ? (
			<span className="text-muted-foreground inline-flex min-h-9 items-center rounded-full px-3 text-sm font-medium shadow-[inset_0_0_0_1px_var(--border)]">
				{text}
			</span>
		) : null;
	}
	if (count === 0) {
		return (
			<button
				type="button"
				aria-label={t("extraAddA11y")}
				onClick={() => form.setItemExtraPeople(item.id, 1)}
				className="border-muted-foreground/50 text-accent inline-flex min-h-11 items-center rounded-full border-[1.5px] border-dashed px-3.5 text-[15px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring"
			>
				{t("extraAdd")}
			</button>
		);
	}
	return (
		<span className="bg-accent-muted text-accent-strong inline-flex min-h-11 items-center rounded-full text-[15px] font-semibold shadow-[inset_0_0_0_1.5px_var(--accent)]">
			<button
				type="button"
				aria-label={t("extraLess")}
				onClick={() => form.setItemExtraPeople(item.id, count - 1)}
				className="flex h-11 w-10 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
			>
				<Minus className="size-4" strokeWidth={2.4} />
			</button>
			<span aria-live="polite" className="px-0.5 whitespace-nowrap tabular-nums">
				{text}
			</span>
			<button
				type="button"
				aria-label={t("extraMore")}
				disabled={count >= MAX_EXTRA_PEOPLE}
				onClick={() => form.setItemExtraPeople(item.id, count + 1)}
				className="flex h-11 w-10 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
			>
				<Plus className="size-4" strokeWidth={2.4} />
			</button>
		</span>
	);
}
