import assert from "node:assert/strict";
import test from "node:test";
import { formatNumber, NUMBER_FORMATS } from "../src/shared/lib/number-format.ts";

test("four formats retain precision, zero, grouping and negative position", () => {
	for (const format of Object.keys(NUMBER_FORMATS) as (keyof typeof NUMBER_FORMATS)[]) {
		const { group, decimal } = NUMBER_FORMATS[format];
		assert.equal(formatNumber(0, format), "0");
		assert.equal(formatNumber(12.5, format), `12${decimal}5`);
		assert.equal(formatNumber(1234.56, format), `1${group}234${decimal}56`);
		assert.equal(formatNumber(1234567.89, format), `1${group}234${group}567${decimal}89`);
		assert.equal(formatNumber(-1234.56, format), `-1${group}234${decimal}56`);
	}
});
