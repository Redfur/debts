import { ChevronDown, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDebtCurrencies } from "@/entities/debt";
import { CURRENCY_SHORT_LABEL, CURRENCY_SYMBOL } from "@/shared/config/currencies";
import {
	setDisplayCurrency,
	setPreferredDisplayCurrency,
	useCurrencyPreferences,
} from "@/shared/lib/currency-preference";
import type { CurrencyCode } from "@/shared/lib/storage";
import { CurrencyPicker } from "@/shared/ui/currency-picker";
import { SET_DISPLAY_CURRENCY_NS } from "../translations";

export function DisplayCurrencySetting() {
	const { t } = useTranslation(SET_DISPLAY_CURRENCY_NS);
	const { current, preferred } = useCurrencyPreferences();
	const { top } = useDebtCurrencies();
	return (
		<>
			<CurrencySettingRow
				currency={preferred}
				onChange={setPreferredDisplayCurrency}
				topCurrencies={top}
				label={t("preferredLabel")}
				hint={t("preferredHint")}
			/>
			<CurrencySettingRow
				currency={current}
				onChange={setDisplayCurrency}
				topCurrencies={top}
				label={t("currentLabel")}
				hint={t("currentHint")}
			/>
		</>
	);
}

function CurrencySettingRow({
	currency,
	onChange,
	topCurrencies,
	label,
	hint,
}: {
	currency: CurrencyCode;
	onChange: (currency: CurrencyCode) => void;
	topCurrencies: readonly CurrencyCode[];
	label: string;
	hint: string;
}) {
	const value = `${CURRENCY_SYMBOL[currency]} ${CURRENCY_SHORT_LABEL[currency]}`;
	const labels = (
		<span className="flex min-w-0 flex-1 flex-col text-left">
			<span className="text-body lg:text-[15px]">{label}</span>
			<span className="text-caption text-muted-foreground">{hint}</span>
		</span>
	);
	const props = { value: currency, onChange, topCurrencies, title: label, triggerLabel: `${label}: ${value}` };
	return (
		<>
			<CurrencyPicker
				{...props}
				triggerClassName="hover:bg-secondary flex w-full min-h-14 gap-3 rounded-none bg-transparent py-2 pr-3 pl-4 text-base font-normal focus-visible:ring-inset lg:hidden"
			>
				{labels}
				<span className="text-muted-foreground max-w-28 shrink-0 text-right text-[15px]">{value}</span>
				<ChevronRight className="text-muted-foreground size-5 shrink-0" aria-hidden="true" />
			</CurrencyPicker>
			<div className="hidden min-h-12 items-center gap-3 lg:flex">
				{labels}
				<CurrencyPicker
					{...props}
					triggerClassName="bg-secondary hover:bg-muted min-h-11 gap-1.5 rounded-[12px] pr-3 pl-3.5 text-sm font-medium"
				>
					{value}
					<ChevronDown className="size-4" aria-hidden="true" />
				</CurrencyPicker>
			</div>
		</>
	);
}
