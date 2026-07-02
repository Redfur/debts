const formatter = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });

/** Форматирует денежную сумму для отображения (разделители разрядов, до 2 знаков после запятой). */
export function formatAmount(value: number): string {
	return formatter.format(value);
}
