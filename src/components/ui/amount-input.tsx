import type * as React from "react";
import { useLayoutEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import {
	displayPosition,
	editAmount,
	formatAmountInput,
	parseAmountPaste,
	rawPosition,
} from "@/shared/lib/amount-edit";
import { useLocalizationPreferences } from "@/shared/lib/localization-preference";

type Props = Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> & {
	/** Нормализованная строка с точкой, включая незавершённую дробь. */
	value: string;
	onValueChange: (raw: string) => void;
	onPasteError?: (invalid: boolean) => void;
};

export function AmountInput({ value, onValueChange, onPasteError, onPaste, ...props }: Props) {
	const { numberFormat } = useLocalizationPreferences();
	const ref = useRef<HTMLInputElement>(null);
	const current = useRef(value);
	current.current = value;
	useLayoutEffect(() => {
		const el = ref.current;
		if (!el) return;
		el.value = formatAmountInput(value, numberFormat);
	}, [value, numberFormat]);

	useLayoutEffect(() => {
		const el = ref.current;
		if (!el) return;
		const apply = (text: string, deletion?: "backward" | "forward") => {
			const result = editAmount(
				current.current,
				rawPosition(el.value, el.selectionStart ?? 0, numberFormat),
				rawPosition(el.value, el.selectionEnd ?? 0, numberFormat),
				text,
				deletion,
			);
			if (!result) return false;
			current.current = result.value;
			el.value = formatAmountInput(result.value, numberFormat);
			const cursor = displayPosition(el.value, result.cursor, numberFormat);
			el.setSelectionRange(cursor, cursor);
			onPasteError?.(false);
			onValueChange(result.value);
			return true;
		};
		const beforeInput = (event: InputEvent) => {
			if (!event.cancelable) return;
			if (event.inputType.startsWith("insert") && event.data !== null) {
				event.preventDefault();
				apply(event.data);
			} else if (event.inputType === "deleteContentBackward" || event.inputType === "deleteContentForward") {
				event.preventDefault();
				apply("", event.inputType === "deleteContentBackward" ? "backward" : "forward");
			}
		};
		el.addEventListener("beforeinput", beforeInput);
		return () => el.removeEventListener("beforeinput", beforeInput);
	}, [numberFormat, onPasteError, onValueChange]);

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		// Невозможный к отмене input (например, автозаполнение): применяем одну операцию по diff, не sanitize.
		const el = event.target;
		const old = formatAmountInput(current.current, numberFormat);
		let start = 0;
		while (start < old.length && start < el.value.length && old[start] === el.value[start]) start++;
		let suffix = 0;
		while (
			suffix < old.length - start &&
			suffix < el.value.length - start &&
			old[old.length - 1 - suffix] === el.value[el.value.length - 1 - suffix]
		)
			suffix++;
		const result = editAmount(
			current.current,
			rawPosition(old, start, numberFormat),
			rawPosition(old, old.length - suffix, numberFormat),
			el.value.slice(start, el.value.length - suffix),
		);
		el.value = formatAmountInput(result?.value ?? current.current, numberFormat);
		if (result) {
			current.current = result.value;
			const position = displayPosition(el.value, result.cursor, numberFormat);
			el.setSelectionRange(position, position);
			onPasteError?.(false);
			onValueChange(result.value);
		}
	};

	return (
		<Input
			{...props}
			ref={ref}
			inputMode="decimal"
			defaultValue={formatAmountInput(value, numberFormat)}
			onChange={handleChange}
			onPaste={(event) => {
				onPaste?.(event);
				if (event.defaultPrevented) return;
				event.preventDefault();
				const parsed = parseAmountPaste(event.clipboardData.getData("text"), numberFormat);
				const el = event.currentTarget;
				const result =
					parsed === null
						? null
						: editAmount(
								current.current,
								rawPosition(el.value, el.selectionStart ?? 0, numberFormat),
								rawPosition(el.value, el.selectionEnd ?? 0, numberFormat),
								parsed,
							);
				if (!result) {
					onPasteError?.(true);
					return;
				}
				current.current = result.value;
				el.value = formatAmountInput(result.value, numberFormat);
				const cursor = displayPosition(el.value, result.cursor, numberFormat);
				el.setSelectionRange(cursor, cursor);
				onPasteError?.(false);
				onValueChange(result.value);
			}}
		/>
	);
}
