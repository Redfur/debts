import { ChevronDown, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CURRENCY_SHORT_LABEL, CURRENCY_SYMBOL } from "@/shared/config/currencies";
import { setDisplayCurrency, useDisplayCurrency } from "@/shared/lib/currency-preference";
import { CurrencyPicker } from "@/shared/ui/currency-picker";
import { SET_DISPLAY_CURRENCY_NS } from "../translations";

/**
 * Строка «Валюта итогов» → шторка выбора валюты. На мобильном нажимается вся строка,
 * на десктопе — кнопка «₽ Рубль» справа.
 */
export function DisplayCurrencySetting() {
	const { t } = useTranslation(SET_DISPLAY_CURRENCY_NS);
	const currency = useDisplayCurrency();
	const value = `${CURRENCY_SYMBOL[currency]} ${CURRENCY_SHORT_LABEL[currency]}`;
	const labels = (
		<span className="flex min-w-0 flex-1 flex-col text-left">
			<span className="text-body lg:text-[15px]">{t("label")}</span>
			<span className="text-caption text-muted-foreground">{t("hint")}</span>
		</span>
	);

	return (
		<>
			<CurrencyPicker
				value={currency}
				onChange={setDisplayCurrency}
				title={t("label")}
				triggerLabel={t("triggerLabel", { value })}
				triggerClassName="hover:bg-secondary flex w-full min-h-14 gap-3 rounded-none bg-transparent py-2 pr-3 pl-4 text-base font-normal focus-visible:ring-inset lg:hidden"
			>
				{labels}
				<span className="text-muted-foreground text-[15px]">{value}</span>
				<ChevronRight className="text-muted-foreground size-5" aria-hidden="true" />
			</CurrencyPicker>
			<div className="hidden min-h-12 items-center gap-3 lg:flex">
				{labels}
				<CurrencyPicker
					value={currency}
					onChange={setDisplayCurrency}
					title={t("label")}
					triggerLabel={t("triggerLabel", { value })}
					triggerClassName="bg-secondary hover:bg-muted min-h-10 gap-1.5 rounded-[12px] pr-3 pl-3.5 text-sm font-medium"
				>
					{value}
					<ChevronDown className="size-4" aria-hidden="true" />
				</CurrencyPicker>
			</div>
		</>
	);
}
