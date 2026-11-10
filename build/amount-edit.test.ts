import assert from "node:assert/strict";
import test from "node:test";
import {
	displayPosition,
	editAmount,
	formatAmountInput,
	parseAmountPaste,
	rawPosition,
} from "../src/shared/lib/amount-edit.ts";
import { NUMBER_FORMATS } from "../src/shared/lib/number-format.ts";

test("strict paste accepts only the selected format and precision", () => {
	for (const format of Object.keys(NUMBER_FORMATS) as (keyof typeof NUMBER_FORMATS)[]) {
		assert.equal(parseAmountPaste(NUMBER_FORMATS[format].example, format), "1234.56");
		assert.equal(parseAmountPaste(`1234${NUMBER_FORMATS[format].decimal}56`, format), "1234.56");
		assert.equal(
			formatAmountInput("1234.", format),
			`1${NUMBER_FORMATS[format].group}234${NUMBER_FORMATS[format].decimal}`,
		);
	}
	assert.equal(parseAmountPaste("1,234", "comma-dot"), "1234");
	for (const input of ["1234,56", "12,34.56", "1.234,56", "1234.567", "$100", "12 text", "", "-1"])
		assert.equal(parseAmountPaste(input, "comma-dot"), null, input);
	for (const space of [" ", "\u00a0", "\u202f"])
		assert.equal(parseAmountPaste(` 1${space}234,56 `, "space-comma"), "1234.56");
});

test("edits operate on normalized values, not generated grouping", () => {
	assert.deepEqual(editAmount("1234", 4, 4, ","), { value: "1234.", cursor: 5 });
	assert.deepEqual(editAmount("1234.56", 1, 2, "9"), { value: "1934.56", cursor: 2 });
	assert.deepEqual(editAmount("1234.56", 2, 2, "", "backward"), { value: "134.56", cursor: 1 });
	assert.deepEqual(editAmount("1234.56", 2, 2, "", "forward"), { value: "124.56", cursor: 2 });
	assert.equal(editAmount("12.34", 5, 5, "5"), null);
	assert.equal(editAmount("12.34", 0, 1, "1.2"), null);
	assert.deepEqual(editAmount("12.34", 0, 5, "1234.56"), { value: "1234.56", cursor: 7 });
	for (const format of Object.keys(NUMBER_FORMATS) as (keyof typeof NUMBER_FORMATS)[]) {
		const display = formatAmountInput("1234.56", format);
		for (let i = 0; i <= 7; i++) assert.equal(rawPosition(display, displayPosition(display, i, format), format), i);
	}
});
