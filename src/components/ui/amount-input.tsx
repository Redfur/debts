import type * as React from "react";
import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";

type Props = Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> & {
	/** Сырое значение суммы: цифры и опционально одна точка-разделитель ("10000.5"). */
	value: string;
	onValueChange: (raw: string) => void;
};

function countDigits(s: string): number {
	return (s.match(/\d/g) ?? []).length;
}

/** Позиция в отформатированной строке сразу после digitCount-й цифры. */
function positionAfterDigits(display: string, digitCount: number): number {
	if (digitCount <= 0) return 0;
	let seen = 0;
	for (let i = 0; i < display.length; i++) {
		if (/\d/.test(display[i])) {
			seen++;
			if (seen === digitCount) return i + 1;
		}
	}
	return display.length;
}

/** Оставляет цифры и одну точку (запятая приводится к точке), не более 2 знаков дробной части. */
function sanitize(input: string): string {
	let s = input.replace(",", ".").replace(/[^\d.]/g, "");
	const firstDot = s.indexOf(".");
	if (firstDot !== -1) {
		s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replaceAll(".", "");
	}
	const [intPart, fracPart] = s.split(".");
	const cleanInt = intPart.replace(/^0+(?=\d)/, "");
	if (fracPart === undefined) return cleanInt;
	return `${cleanInt}.${fracPart.slice(0, 2)}`;
}

/** Форматирует сырое значение для отображения: разряды по 3 цифры через пробел, дробная часть через запятую. */
function formatDisplay(raw: string): string {
	if (!raw) return "";
	const [intPart, fracPart] = raw.split(".");
	const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ") || "0";
	if (fracPart === undefined) return raw.endsWith(".") ? `${grouped},` : grouped;
	return `${grouped},${fracPart}`;
}

/** Текстовое поле суммы с маской разрядов (10000 → 10 000) поверх сырого числового значения. */
export function AmountInput({ value, onValueChange, ...props }: Props) {
	const ref = useRef<HTMLInputElement>(null);

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const el = event.target;
		const cursor = el.selectionStart ?? el.value.length;
		const digitsBeforeCursor = countDigits(el.value.slice(0, cursor));
		const raw = sanitize(el.value);
		const display = formatDisplay(raw);
		el.value = display;
		const nextPos = positionAfterDigits(display, digitsBeforeCursor);
		el.setSelectionRange(nextPos, nextPos);
		onValueChange(raw);
	};

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		if (sanitize(el.value) !== value) {
			el.value = formatDisplay(value);
		}
	}, [value]);

	return <Input ref={ref} inputMode="decimal" defaultValue={formatDisplay(value)} onChange={handleChange} {...props} />;
}
