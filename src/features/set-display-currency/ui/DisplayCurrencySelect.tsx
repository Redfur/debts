import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CURRENCY_LABEL, CURRENCY_SYMBOL, isSupportedCurrency, SUPPORTED_CURRENCIES } from "@/shared/config/currencies";
import { setDisplayCurrency, useDisplayCurrency } from "@/shared/lib/currency-preference";

type Props = {
	labelId: string;
};

export function DisplayCurrencySelect({ labelId }: Props) {
	const currency = useDisplayCurrency();

	return (
		<Select
			value={currency}
			onValueChange={(v) => {
				if (isSupportedCurrency(v)) setDisplayCurrency(v);
			}}
		>
			<SelectTrigger id="display-currency-select" aria-labelledby={labelId} className="max-w-full min-w-0 w-full">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{SUPPORTED_CURRENCIES.map((code) => (
					<SelectItem key={code} value={code}>
						{CURRENCY_SYMBOL[code]} {CURRENCY_LABEL[code]}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
