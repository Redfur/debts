import { Check, ChevronDown } from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CURRENCY_LABEL, CURRENCY_SYMBOL, currencyGroups, isSupportedCurrency } from "@/shared/config/currencies";
import type { CurrencyCode } from "@/shared/lib/storage";
import { cn } from "@/shared/lib/utils";
import { SearchField } from "@/shared/ui/search-field";
import { CURRENCY_PICKER_NS } from "./translations";

type Props = {
	value: CurrencyCode;
	onChange: (currency: CurrencyCode) => void;
	topCurrencies: readonly CurrencyCode[];
	title: string;
	triggerLabel: string;
	disabled?: boolean;
	children?: ReactNode;
	triggerClassName?: string;
};

/** Полный офлайн-каталог. Предметный набор верхней группы передаётся сверху. */
export function CurrencyPicker({
	value,
	onChange,
	topCurrencies,
	title,
	triggerLabel,
	disabled,
	children,
	triggerClassName,
}: Props) {
	const { t } = useTranslation(CURRENCY_PICKER_NS);
	const [open, setOpen] = useState(false);
	const id = useId();
	const [query, setQuery] = useState("");
	const groups = currencyGroups(topCurrencies, query);
	const changeOpen = (next: boolean) => {
		setOpen(next);
		if (!next) setQuery("");
	};
	const select = (code: CurrencyCode) => {
		onChange(code);
		changeOpen(false);
	};
	return (
		<Dialog open={open} onOpenChange={changeOpen}>
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
			<DialogContent className="overflow-hidden">
				<DialogTitle className="shrink-0 px-1 pt-1">{title}</DialogTitle>
				<DialogDescription className="sr-only">{title}</DialogDescription>
				<SearchField
					value={query}
					onValueChange={setQuery}
					label={t("search")}
					placeholder={t("search")}
					clearLabel={t("clear")}
					surface="field"
					className="shrink-0"
				/>
				<RadioGroup
					onValueChange={(code) => {
						if (isSupportedCurrency(code)) select(code);
					}}
					value={value}
					aria-label={title}
					className="min-h-0 gap-4 overflow-y-auto overscroll-contain"
				>
					{(["top", "other"] as const).map(
						(group) =>
							groups[group].length > 0 && (
								<div key={group} className="flex flex-col gap-2">
									<h3 className="text-caption text-muted-foreground px-1 font-semibold">
										{t(group === "top" ? "yours" : "other")}
									</h3>
									<div className="bg-secondary overflow-hidden rounded-control">
										{groups[group].map((code) => (
											<label
												key={code}
												htmlFor={`${id}-${code}`}
												className="hover:bg-muted has-[:focus-visible]:bg-muted relative flex min-h-13 cursor-pointer items-center gap-3 px-4 not-last:border-b"
											>
												<RadioGroupItem
													id={`${id}-${code}`}
													value={code}
													aria-label={`${CURRENCY_LABEL[code]}, ${code}`}
													onClick={() => {
														if (code === value) changeOpen(false);
													}}
													className="sr-only"
												/>
												<span
													aria-hidden="true"
													className="bg-card flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
												>
													{CURRENCY_SYMBOL[code]}
												</span>
												<span className="text-body flex min-w-0 flex-1 flex-col py-2">
													<span>{CURRENCY_LABEL[code]}</span>
													<span className="text-caption text-muted-foreground">{code}</span>
												</span>
												{code === value && <Check className="text-accent size-5 shrink-0" aria-hidden="true" />}
											</label>
										))}
									</div>
								</div>
							),
					)}
					{groups.top.length + groups.other.length === 0 && (
						<p role="status" className="text-muted-foreground py-6 text-center">
							{t("empty")}
						</p>
					)}
				</RadioGroup>
			</DialogContent>
		</Dialog>
	);
}
