import { Check, ChevronDown } from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CURRENCY_LABEL, CURRENCY_SYMBOL, SUPPORTED_CURRENCIES } from "@/shared/config/currencies";
import type { CurrencyCode } from "@/shared/lib/storage";
import { cn } from "@/shared/lib/utils";

type Props = {
	value: CurrencyCode;
	onChange: (currency: CurrencyCode) => void;
	/** Заголовок шторки выбора. */
	title: string;
	/** Подпись кнопки для экранного диктора («Валюта: рубль»). */
	triggerLabel: string;
	disabled?: boolean;
	/** Своё содержимое кнопки (по умолчанию — символ валюты и шеврон). */
	children?: ReactNode;
	triggerClassName?: string;
};

/** Кнопка выбора валюты: открывает шторку (диалог на десктопе) со списком поддерживаемых валют. */
export function CurrencyPicker({ value, onChange, title, triggerLabel, disabled, children, triggerClassName }: Props) {
	const [open, setOpen] = useState(false);
	const radioName = useId();

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger
				disabled={disabled}
				aria-label={triggerLabel}
				className={cn(
					"bg-background text-foreground flex min-h-11 shrink-0 items-center gap-1 rounded-full pr-3 pl-3.5 text-[18px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
					triggerClassName,
				)}
			>
				{children ?? (
					<>
						{CURRENCY_SYMBOL[value]}
						<ChevronDown className="size-4" aria-hidden="true" />
					</>
				)}
			</DialogTrigger>
			<DialogContent>
				<DialogTitle className="px-1 pt-1">{title}</DialogTitle>
				<DialogDescription className="sr-only">{title}</DialogDescription>
				<fieldset className="bg-secondary m-0 flex min-w-0 flex-col overflow-hidden rounded-control border-0 p-0">
					<legend className="sr-only">{title}</legend>
					{SUPPORTED_CURRENCIES.map((code) => {
						const selected = code === value;
						return (
							<label
								key={code}
								className="hover:bg-muted has-[:focus-visible]:bg-muted flex min-h-13 cursor-pointer items-center gap-3 px-4 not-last:border-b"
							>
								<input
									type="radio"
									name={radioName}
									value={code}
									checked={selected}
									onChange={() => {
										onChange(code);
										setOpen(false);
									}}
									// Клик по уже выбранной валюте тоже закрывает шторку.
									onClick={() => setOpen(false)}
									className="sr-only"
								/>
								<span className="bg-card flex size-9 items-center justify-center rounded-full text-[17px] font-semibold">
									{CURRENCY_SYMBOL[code]}
								</span>
								<span className="text-body flex-1">{CURRENCY_LABEL[code]}</span>
								{selected ? <Check className="text-accent size-5" aria-hidden="true" /> : null}
							</label>
						);
					})}
				</fieldset>
			</DialogContent>
		</Dialog>
	);
}
