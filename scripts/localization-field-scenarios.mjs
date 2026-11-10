import assert from "node:assert/strict";

export async function run({ evaluate, c, sleep }) {
	const waitFor = async (expression) => {
		for (let i = 0; i < 100; i++) {
			if (await evaluate(expression)) return;
			await sleep(50);
		}
		throw Error(`Timed out: ${expression}`);
	};
	await waitFor("!!document.querySelector('#amount')");
	await evaluate(
		`import('/src/shared/lib/localization-preference.ts').then(m => { window.preferences = m.localizationPreferences; preferences.setLanguage('en'); preferences.setNumberFormat('comma-dot'); })`,
	);
	const input = () => evaluate("document.querySelector('#amount').value");
	const raw = () => evaluate("document.querySelector('#raw').textContent");
	const select = (start, end = start) =>
		evaluate(
			`(() => { const el = document.querySelector('#amount'); el.focus(); el.setSelectionRange(${start}, ${end}); })()`,
		);
	const type = (text) => c("Input.insertText", { text });
	const paste = (text) =>
		evaluate(
			`(() => { const clipboardData = new DataTransfer(); clipboardData.setData('text/plain', ${JSON.stringify(text)}); document.querySelector('#amount').dispatchEvent(new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true })); })()`,
		);
	for (const [format, expected] of [
		["space-comma", "1 234,56"],
		["space-dot", "1 234.56"],
		["comma-dot", "1,234.56"],
		["dot-comma", "1.234,56"],
	]) {
		await evaluate(`preferences.setNumberFormat('${format}')`);
		const money = `${expected.replaceAll(" ", " ")} ₽`;
		await waitFor(`document.querySelector('#money').textContent === ${JSON.stringify(money)}`);
		assert.equal(await input(), expected);
		assert.equal(await raw(), "1234.56");
		assert.ok((await evaluate("document.body.textContent")).includes(money));
	}
	await evaluate("preferences.setNumberFormat('comma-dot')");
	await select(0, 100);
	await type("1234,56");
	assert.equal(await input(), "1,234.56");
	await select(3, 4);
	await type("9");
	assert.equal(await raw(), "1294.56");
	assert.equal(await evaluate("document.querySelector('#amount').selectionStart"), 4);
	await c("Input.dispatchKeyEvent", { type: "keyDown", key: "Backspace", code: "Backspace", windowsVirtualKeyCode: 8 });
	await c("Input.dispatchKeyEvent", { type: "keyUp", key: "Backspace", code: "Backspace", windowsVirtualKeyCode: 8 });
	assert.equal(await raw(), "124.56");
	await select(1);
	await c("Input.dispatchKeyEvent", { type: "keyDown", key: "Delete", code: "Delete", windowsVirtualKeyCode: 46 });
	await c("Input.dispatchKeyEvent", { type: "keyUp", key: "Delete", code: "Delete", windowsVirtualKeyCode: 46 });
	assert.equal(await raw(), "14.56");
	await select(0, 100);
	await type("1234.");
	assert.equal(await raw(), "1234.");
	await evaluate("preferences.setNumberFormat('dot-comma')");
	assert.equal(await input(), "1.234,");
	await type("5");
	assert.equal(await raw(), "1234.5");
	await select(0, 100);
	await paste("1.234,56");
	assert.equal(await raw(), "1234.56");
	for (const text of ["1234.56", "1,234.56", "12.34,56", "1234,567", "123 ₽"]) {
		await select(0, 100);
		await paste(text);
		assert.equal(await raw(), "1234.56");
		assert.equal(await evaluate("document.querySelector('#amount').getAttribute('aria-invalid')"), "true");
		assert.ok(
			await evaluate(
				"document.getElementById(document.querySelector('#amount').getAttribute('aria-describedby'))?.textContent.includes('Invalid number format')",
			),
		);
	}
	await select(0, 100);
	await type("10");
	assert.notEqual(await evaluate("document.querySelector('#amount').getAttribute('aria-invalid')"), "true");
	await select(1);
	await paste("1,23");
	assert.equal(await raw(), "10"); // Третья дробная цифра отклоняет всю операцию.
	assert.deepEqual(JSON.parse(await evaluate("document.querySelector('#dates').textContent")), [
		"12 Sep 2025",
		"15 October",
		"15 October at 12:40",
		"12 October 2026, 18:05",
		"7 November 2026",
	]);
	assert.deepEqual(JSON.parse(await evaluate("document.querySelector('#people').textContent")), [
		"1 person",
		"2 people",
		"5 people",
		"11 people",
		"22 people",
	]);
	await evaluate("preferences.setLanguage('ru')");
	await waitFor("document.querySelector('#dates').textContent.includes('октября')");
	assert.deepEqual(JSON.parse(await evaluate("document.querySelector('#dates').textContent")), [
		"12 сен 2025",
		"15 октября",
		"15 октября в 12:40",
		"12 октября 2026, 18:05",
		"7 ноября 2026",
	]);
	assert.deepEqual(JSON.parse(await evaluate("document.querySelector('#people').textContent")), [
		"1 человека",
		"двоих",
		"пятерых",
		"11 человек",
		"22 человека",
	]);
	for (const timezoneId of ["America/Los_Angeles", "Pacific/Kiritimati"]) {
		await c("Emulation.setTimezoneOverride", { timezoneId });
		await evaluate("preferences.setLanguage('en')");
		await waitFor("document.querySelector('#dates').textContent.includes('November')");
		assert.equal(JSON.parse(await evaluate("document.querySelector('#dates').textContent"))[4], "7 November 2026");
		await evaluate("preferences.setLanguage('ru')");
		await waitFor("document.querySelector('#dates').textContent.includes('ноября')");
		assert.equal(JSON.parse(await evaluate("document.querySelector('#dates').textContent"))[4], "7 ноября 2026");
	}
}
