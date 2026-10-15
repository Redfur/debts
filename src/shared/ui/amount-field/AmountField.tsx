import { AmountInput } from "@/components/ui/amount-input";
import { CURRENCY_SHORT_LABEL } from "@/shared/config/currencies";
import type { CurrencyCode } from "@/shared/lib/storage";
import { cn } from "@/shared/lib/utils";
import { CurrencyPicker } from "@/shared/ui/currency-picker";

type Props = {
	id: string;
	/** Подпись поля для экранного диктора («Сумма»). */
	label: string;
	value: string;
	onValueChange: (raw: string) => void;
	currency: CurrencyCode;
	onCurrencyChange: (currency: CurrencyCode) => void;
	/** Заголовок шторки выбора валюты. */
	currencyTitle: string;
	/** Подпись кнопки валюты по короткому названию в нижнем регистре: «Валюта: рубль». */
	currencyLabel: (name: string) => string;
	invalid?: boolean;
	describedBy?: string;
	disabled?: boolean;
	autoFocus?: boolean;
	/** `card` — белая карточка с тенью на фоне экрана; `sheet` — серое поле внутри шторки; `plain` — без фона (часть карточки). */
	surface?: "card" | "sheet" | "plain";
};

/** Крупное поле суммы на карточке и кнопка валюты справа (форма нового долга, изменение долга). */
export function AmountField({
	id,
	label,
	value,
	onValueChange,
	currency,
	onCurrencyChange,
	currencyTitle,
	currencyLabel,
	invalid,
	describedBy,
	disabled,
	autoFocus,
	surface = "card",
}: Props) {
	return (
		<div
			className={cn(
				"flex items-center gap-2.5 rounded-card py-3.5 pr-2.5 pl-5 transition-shadow focus-within:shadow-[inset_0_0_0_2px_var(--ring)]",
				surface === "card" && "bg-card shadow-card",
				surface === "sheet" && "bg-secondary",
				invalid &&
					"shadow-[inset_0_0_0_2px_var(--destructive)] focus-within:shadow-[inset_0_0_0_2px_var(--destructive)]",
				disabled && surface !== "plain" && "bg-secondary shadow-none",
			)}
		>
			<label htmlFor={id} className="sr-only">
				{label}
			</label>
			<AmountInput
				id={id}
				placeholder="0"
				value={value}
				onValueChange={onValueChange}
				aria-invalid={invalid || undefined}
				aria-describedby={describedBy}
				disabled={disabled}
				autoFocus={autoFocus}
				autoComplete="off"
				className="caret-accent placeholder:text-muted-foreground/60 h-13 min-h-0 flex-1 rounded-none bg-transparent px-0 text-[44px] leading-[52px] font-bold tracking-[-0.03em] focus-visible:shadow-none disabled:bg-transparent disabled:shadow-none aria-invalid:shadow-none lg:text-[44px]"
			/>
			<CurrencyPicker
				value={currency}
				onChange={onCurrencyChange}
				title={currencyTitle}
				triggerLabel={currencyLabel(CURRENCY_SHORT_LABEL[currency].toLowerCase())}
				disabled={disabled}
				triggerClassName={surface === "sheet" ? "bg-card" : undefined}
			/>
		</div>
	);
}
