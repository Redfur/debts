import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

export async function run({ evaluate, c, sleep }) {
	await c("Page.addScriptToEvaluateOnNewDocument", {
		source: "Object.defineProperty(navigator, 'languages', { configurable: true, value: ['en-US', 'ru-RU'] });",
	});
	const waitFor = async (expression) => {
		for (let i = 0; i < 150; i++) {
			if (await evaluate(expression)) return;
			await sleep(50);
		}
		throw Error(`Timed out: ${expression}; ${await evaluate("document.body.innerText")}`);
	};
	const navigate = async (path) => {
		await c("Page.navigate", { url: `http://127.0.0.1:4189${path}` });
		await waitFor("document.querySelector('h1') !== null");
		await evaluate(`(async () => {
			window.preferences = (await import('/src/shared/lib/localization-preference.ts')).localizationPreferences;
			window.debtStore = (await import('/src/entities/debt/model/debt-store.ts')).useDebtStore;
			window.draftStore = (await import('/src/entities/debt/model/creation-drafts/creation-draft-store.ts')).useCreationDraftStore;
			window.currencyPreferences = await import('/src/shared/lib/currency-preference.ts');
			window.storage = (await import('/src/shared/lib/storage/index.ts')).getStorageAdapter();
		})()`);
		await waitFor("debtStore.getState().hydrated");
	};
	const clickText = async (text, selector = "button") => {
		await evaluate(
			`(() => { const el = [...document.querySelectorAll(${JSON.stringify(selector)})].find(el => el.textContent.trim() === ${JSON.stringify(text)} && el.getBoundingClientRect().height); if (!el) throw Error('Missing button: ' + ${JSON.stringify(text)}); el.click(); })()`,
		);
	};
	const clickSetting = async (title) =>
		evaluate(
			`(() => { const button = [...document.querySelectorAll('button')].find(el => el.getAttribute('aria-label')?.startsWith(${JSON.stringify(`${title}: `)}) && el.getBoundingClientRect().height); if (!button) throw Error('Missing setting button'); button.click(); })()`,
		);
	const checkSettingRow = async (title, value, mobile = false) => {
		const state = await evaluate(
			`(() => { const button = [...document.querySelectorAll('button')].find(el => el.getAttribute('aria-label')?.startsWith(${JSON.stringify(`${title}: `)}) && el.getBoundingClientRect().height); const label = ${mobile} ? button.querySelector('span') : button.parentElement.querySelector('span'); if (!${mobile}) label.click(); return { value: button.querySelector('span:last-of-type')?.textContent.trim() ?? button.textContent.trim(), labelIsStatic: !label.closest('button'), dialog: !!document.querySelector('[role=dialog]') }; })()`,
		);
		assert.deepEqual(state, { value, labelIsStatic: !mobile, dialog: false });
		assert.ok(
			await evaluate(
				`(() => { const visible = el => el.getBoundingClientRect().height; const buttons = [...document.querySelectorAll('button')]; const setting = buttons.find(el => el.getAttribute('aria-label')?.startsWith(${JSON.stringify(`${title}: `)}) && visible(el)); const currency = buttons.find(el => el.getAttribute('aria-label')?.startsWith('Preferred totals currency:') && visible(el)); return getComputedStyle(setting).backgroundColor === getComputedStyle(currency).backgroundColor && getComputedStyle(setting).borderRadius === getComputedStyle(currency).borderRadius; })()`,
			),
		);
	};
	const setInput = async (selector, text) => {
		await evaluate(
			`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) throw Error('Missing input'); el.focus(); el.select(); })()`,
		);
		await c("Input.insertText", { text });
	};
	await navigate("/settings");
	assert.equal(await evaluate("document.documentElement.lang"), "en");
	assert.equal(await evaluate("document.title"), "Debts");
	assert.equal(await evaluate("localStorage.getItem('debts.preferredDisplayCurrency')"), "USD");
	assert.equal(await evaluate("document.querySelectorAll('link[rel=manifest]').length"), 1);
	assert.ok((await evaluate("document.querySelector('link[rel=manifest]').href")).endsWith("site.en.webmanifest"));
	await checkSettingRow("Interface language", "System default", true);
	await checkSettingRow("Number format", "1,234.56", true);
	await clickSetting("Interface language");
	await waitFor("!!document.querySelector('[role=dialog]')");
	assert.equal(await evaluate("document.querySelectorAll('[role=dialog] [role=radio]').length"), 3);
	await clickText("Русский", "label");
	console.log("selected Russian");
	await waitFor("!document.querySelector('[role=dialog]') && document.documentElement.lang === 'ru'");
	assert.equal(await evaluate("document.title"), "Долги");
	await evaluate(
		"currencyPreferences.setPreferredDisplayCurrency('EUR'); currencyPreferences.setDisplayCurrency('THB'); preferences.setLanguage('en');",
	);
	assert.equal(await evaluate("localStorage.getItem('debts.displayCurrency')"), "THB");
	assert.equal(await evaluate("localStorage.getItem('debts.preferredDisplayCurrency')"), "EUR");
	await clickSetting("Number format");
	await waitFor("!!document.querySelector('[role=dialog]')");
	assert.equal(await evaluate("document.querySelectorAll('[role=dialog] [role=radio]').length"), 5);
	assert.ok((await evaluate("document.querySelector('[role=dialog]').textContent")).includes("By language · 1,234.56"));
	await clickText("1 234.56", "label");
	console.log("selected number format");
	await waitFor("!document.querySelector('[role=dialog]')");
	assert.equal(await evaluate("document.activeElement.getAttribute('aria-label')"), "Number format: 1 234.56");
	await clickSetting("Number format");
	await waitFor("!!document.querySelector('[role=dialog]')");
	await sleep(250);
	await evaluate("document.querySelector('[role=dialog] [role=radio][data-state=checked]').focus()");
	await c("Input.dispatchKeyEvent", {
		type: "keyDown",
		key: "ArrowDown",
		code: "ArrowDown",
		windowsVirtualKeyCode: 40,
	});
	await sleep(100);
	await c("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowDown", code: "ArrowDown", windowsVirtualKeyCode: 40 });
	await c("Input.dispatchKeyEvent", { type: "keyDown", key: " ", code: "Space", windowsVirtualKeyCode: 32, text: " " });
	await c("Input.dispatchKeyEvent", { type: "keyUp", key: " ", code: "Space", windowsVirtualKeyCode: 32 });
	await waitFor("!document.querySelector('[role=dialog]')");
	assert.equal(await evaluate("preferences.getSnapshot().numberFormatPreference"), "comma-dot");
	await evaluate("preferences.setNumberFormat('space-dot')");
	await evaluate(
		`import('/src/features/install-app/model/install-state.ts').then(module => { window.install = module; return true; })`,
	);
	await evaluate(`(() => {
		const event = new Event('beforeinstallprompt', { cancelable: true }); event.prompt = async () => {}; event.userChoice = Promise.resolve({ outcome: 'dismissed' });
		window.dispatchEvent(event); if (!install.getInstallState().nativePromptAvailable) throw Error('prompt not captured');
		preferences.setLanguage('ru'); if (install.getInstallState().nativePromptAvailable) throw Error('stale prompt retained');
		preferences.setLanguage('en');
	})()`);

	// Реальное создание долга и сохранение нормализованного черновика.
	console.log("settings and stale install prompt checked");
	await navigate("/new");
	await waitFor("!!document.querySelector('input[role=combobox]')");
	await setInput('input[role="combobox"]', "Анна Test");
	await evaluate("document.querySelector('button[role=option]').click()");
	await waitFor("!document.querySelector('input[role=combobox]')");
	await setInput('input[inputmode="decimal"]', "1234,56");
	await waitFor(
		"draftStore.getState().debt.status === 'saved' && draftStore.getState().debt.draft.payload.amount === '1234.56'",
	);
	assert.equal(await evaluate("draftStore.getState().debt.draft.payload.amount"), "1234.56");
	assert.equal(await evaluate("draftStore.getState().debt.draft.payload.currency"), "RUB");
	await evaluate("preferences.setNumberFormat('dot-comma')");
	assert.equal(await evaluate("document.querySelector('input[inputmode=decimal]').value"), "1.234,56");
	assert.equal(await evaluate("draftStore.getState().debt.draft.payload.amount"), "1234.56");
	await c("Page.reload");
	await sleep(500);
	await waitFor("document.querySelector('input[inputmode=decimal]')?.value === '1.234,56'");
	await clickText("Create debt");
	await waitFor("location.pathname === '/'");
	await navigate("/");
	const debt = await evaluate("Object.values(debtStore.getState().debtsById).find(d => d.principalAmount === 1234.56)");
	assert.ok(debt);
	await navigate(`/contacts/${debt.contactId}`);
	await clickText("Edit");
	await waitFor("!!document.querySelector('[role=dialog] input[inputmode=decimal]')");
	await setInput('[role=dialog] input[inputmode="decimal"]', "1300.5");
	await clickText("Save");
	await waitFor("!document.querySelector('[role=dialog]')");
	assert.ok((await evaluate("document.body.innerText")).includes("1.300,5"));
	await clickText("Repay");
	await waitFor("!!document.querySelector('[role=dialog] input[inputmode=decimal]')");
	await setInput('[role=dialog] input[inputmode="decimal"]', "100,5");
	await clickText("Save");
	await waitFor("!document.querySelector('[role=dialog]')");
	assert.ok((await evaluate("document.body.innerText")).includes("1.200"));
	assert.equal(await evaluate(`debtStore.getState().debtsById['${debt.id}'].principalAmount`), 1300.5);

	// Сброс возвращает системные значения в правильном порядке и не трогает записи/служебные отметки.
	await evaluate(
		`Object.defineProperty(navigator, 'languages', { configurable: true, value: ['de-DE', 'ru-RU', 'en-US'] }); localStorage.setItem('debts.installBannerDismissed', '1');`,
	);
	await navigate("/settings");
	await evaluate(
		`Object.defineProperty(navigator, 'languages', { configurable: true, value: ['de-DE', 'ru-RU', 'en-US'] });`,
	);
	await evaluate(
		`(async () => { const drafts = await import('/src/entities/debt/model/creation-drafts/creation-draft-store.ts'); await drafts.hydrateCreationDraft('debt'); drafts.saveCreationDraft('debt', { contactId: '${debt.contactId}', direction: 'i_owe', currency: 'THB', amount: '12.5', note: 'Черновик Test' }); await drafts.flushCreationDraft('debt'); })()`,
	);
	await clickText(
		"Reset interface settingsTheme, language, number format and totals currency settings. Debts and drafts are not affected.",
	);
	await waitFor("!!document.querySelector('[role=alertdialog]')");
	await clickText("Cancel");
	await waitFor("!document.querySelector('[role=alertdialog]')");
	assert.equal(await evaluate("preferences.getSnapshot().language"), "en");
	await clickText(
		"Reset interface settingsTheme, language, number format and totals currency settings. Debts and drafts are not affected.",
	);
	await waitFor("!!document.querySelector('[role=alertdialog]')");
	await clickText("Reset settings");
	await waitFor("document.documentElement.lang === 'ru'");
	assert.equal(await evaluate("preferences.getSnapshot().numberFormat"), "space-comma");
	assert.equal(await evaluate("document.title"), "Долги");
	assert.equal(await evaluate("localStorage.getItem('debts.installBannerDismissed')"), "1");
	assert.ok(await evaluate(`debtStore.getState().debtsById['${debt.id}']`));
	assert.equal(await evaluate("draftStore.getState().debt.draft.payload.amount"), "12.5");
	assert.equal(await evaluate("draftStore.getState().debt.draft.payload.currency"), "THB");
	await evaluate(
		`import('/src/entities/debt/model/creation-drafts/creation-draft-store.ts').then(m => m.deleteCreationDraft('debt'))`,
	);
	// Ключи удалены; валютный снимок читается через компоненты и локальный независимый стор.
	assert.ok((await evaluate("document.body.innerText")).includes("₽ Рубль"));
	await evaluate(`preferences.setLanguage('en'); preferences.setNumberFormat('space-dot')`);
	await navigate("/settings/changelog");
	assert.ok((await evaluate("document.body.innerText")).includes("Version 2.4.0"));
	assert.ok((await evaluate("document.body.innerText")).includes("Черновики долгов"));
	assert.ok(!(await evaluate("document.body.innerText")).includes("Unreleased"));
	await c("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
	await navigate("/settings");
	assert.ok(await evaluate("document.documentElement.scrollWidth <= innerWidth"));
	await checkSettingRow("Interface language", "English");
	await checkSettingRow("Number format", "1 234.56");
	await evaluate("preferences.setLanguage('ru'); preferences.setNumberFormat('space-dot')");
	await navigate("/new");
	await clickText("Создать долг");
	assert.ok((await evaluate("document.body.innerText")).includes("Выберите или создайте контакт"));
	await evaluate("preferences.setLanguage('en')");
	await waitFor("document.body.innerText.includes('Select or create a contact')");
	await evaluate("preferences.setLanguage('ru')");
	await setInput('input[role="combobox"]', "Анна");
	await evaluate("document.querySelector('button[role=option]').click()");
	await waitFor("!document.querySelector('input[role=combobox]')");
	await setInput('input[inputmode="decimal"]', "200,5");
	await clickText("Создать долг");
	await waitFor("location.pathname === '/'");
	await navigate(`/contacts/${debt.contactId}`);
	const russianDebtId = await evaluate(
		"Object.values(debtStore.getState().debtsById).find(d => d.principalAmount === 200.5).id",
	);
	await clickText("Изменить");
	await waitFor("!!document.querySelector('[role=dialog] input[inputmode=decimal]')");
	await setInput('[role=dialog] input[inputmode="decimal"]', "300.5");
	await clickText("Сохранить");
	await waitFor("!document.querySelector('[role=dialog]')");
	await clickText("Погасить");
	await waitFor("!!document.querySelector('[role=dialog] input[inputmode=decimal]')");
	await setInput('[role=dialog] input[inputmode="decimal"]', "100.5");
	await clickText("Сохранить");
	await waitFor("!document.querySelector('[role=dialog]')");
	assert.equal(await evaluate(`debtStore.getState().debtsById['${russianDebtId}'].principalAmount`), 300.5);
	// Все способы деления: доменное создание, экран счёта и реальное сохранение формы на обоих языках.
	for (const language of ["en", "ru"]) {
		await evaluate(`preferences.setLanguage('${language}'); preferences.setNumberFormat('language')`);
		const ids = await evaluate(`(async () => {
			const store = debtStore.getState();
			const contactId = Object.keys(store.contactsById)[0];
			const ids = [];
			for (const splitMode of ['equal', 'shares', 'amounts', 'items']) {
				const receipt = splitMode === 'items';
				const totalAmount = receipt ? 1188.26 : 1234.56;
				const participants = [
					{ ref: 'me', paid: totalAmount, inSplit: true, shareInput: splitMode === 'shares' ? 1 : splitMode === 'amounts' ? 617.28 : null },
					{ ref: contactId, paid: 0, inSplit: true, shareInput: splitMode === 'shares' ? 1 : splitMode === 'amounts' ? 617.28 : null },
				];
				const id = await store.createBill({ title: 'Кафе Test ${language} ' + splitMode, currency: 'RUB', totalAmount, splitMode, participants,
					items: receipt ? [{ id: crypto.randomUUID(), title: 'Чай Test', price: 1234.56, refs: ['me', contactId], extraPeople: 0 }] : [],
					discount: receipt ? { unit: 'percent', value: 12.5 } : null,
					tips: receipt ? { unit: 'percent', value: 10, refs: ['me', contactId], extraPeople: 0 } : null });
				if (!id) throw Error('Bill creation failed: ' + splitMode);
				ids.push(id);
			}
			return ids;
		})()`);
		for (const id of ids) {
			await navigate(`/bills/${id}`);
			const original = await evaluate(`JSON.stringify(debtStore.getState().billsById['${id}'])`);
			assert.ok((await evaluate("document.body.innerText")).includes("Кафе Test"));
			await navigate(`/bills/${id}/edit`);
			await waitFor("!!document.querySelector('input[inputmode=decimal]')");
			// Каждое поле суммы/оплаты/доли/позиции/процентов получает общую доступную ошибку вставки.
			const fields = await evaluate(
				"[...document.querySelectorAll('input[inputmode=decimal]')].filter(el => !el.disabled && el.getBoundingClientRect().height).map(el => el.id)",
			);
			for (const fieldId of fields) {
				const selector = `input[id=${JSON.stringify(fieldId)}]`;
				await evaluate(
					`(() => { const el = document.querySelector(${JSON.stringify(selector)}); el.focus(); el.select(); const data = new DataTransfer(); data.setData('text/plain', 'invalid $123'); el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true })); })()`,
				);
				assert.equal(
					await evaluate(`document.querySelector(${JSON.stringify(selector)}).getAttribute('aria-invalid')`),
					"true",
				);
				assert.ok(
					await evaluate(
						`document.getElementById(document.querySelector(${JSON.stringify(selector)}).getAttribute('aria-describedby').split(' ').at(-1))?.textContent`,
					),
				);
				await evaluate(
					`(() => { const el = document.querySelector(${JSON.stringify(selector)}); el.select(); const data = new DataTransfer(); data.setData('text/plain', el.value || '0'); el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true })); })()`,
				);
				assert.notEqual(
					await evaluate(`document.querySelector(${JSON.stringify(selector)}).getAttribute('aria-invalid')`),
					"true",
				);
			}
			await clickText(language === "en" ? "Save bill" : "Сохранить счёт");
			await waitFor(`location.pathname === '/bills/${id}'`);
			const result = JSON.parse(await evaluate(`JSON.stringify(debtStore.getState().billsById['${id}'])`));
			const previous = JSON.parse(original);
			assert.equal(result.totalAmount, previous.totalAmount);
			assert.deepEqual(result.participants, previous.participants);
			assert.deepEqual(result.items, previous.items);
			assert.deepEqual(result.discount, previous.discount);
			assert.deepEqual(result.tips, previous.tips);
		}
	}
	// Бэкап остаётся версии 3, без предпочтений и черновиков. Импорт и удаление только данных их не сбрасывают.
	const backupResult = await evaluate(`(async () => {
		const backup = await import('/src/shared/lib/storage/backup.ts');
		preferences.setLanguage('en'); preferences.setNumberFormat('space-dot');
		const original = await backup.createDebtsBackup();
		const text = backup.serializeDebtsBackup(original);
		const parsed = backup.parseDebtsBackup(text);
		await backup.restoreDebtsFromBackup(parsed);
		return { version: parsed.version, keys: Object.keys(parsed).sort(), bills: parsed.bills.length, currency: parsed.debts[0].currency,
			language: preferences.getSnapshot().language, format: preferences.getSnapshot().numberFormat,
			filename: backup.buildDebtsBackupFilename(new Date('2026-11-10T12:00:00Z')) };
	})()`);
	assert.equal(backupResult.version, 3);
	assert.equal(backupResult.bills, 8);
	assert.equal(backupResult.currency, "RUB");
	assert.equal(backupResult.language, "en");
	assert.equal(backupResult.format, "space-dot");
	assert.equal(backupResult.filename, "debts-backup-2026-11-10.json");
	assert.deepEqual(backupResult.keys, [
		"bills",
		"contacts",
		"debtOperations",
		"debts",
		"exportedAt",
		"meta",
		"version",
	]);
	for (const language of ["ru", "en"]) {
		await navigate("/settings");
		await evaluate(`preferences.setLanguage('${language}')`);
		const directory = mkdtempSync("/tmp/opencode/debts-localization-backup-");
		await c("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: directory });
		await clickText(language === "en" ? "Save to file" : "Сохранить в файл");
		let file;
		for (let i = 0; i < 100; i++) {
			file = readdirSync(directory).find((file) => file.endsWith(".json"));
			if (file) break;
			await sleep(50);
		}
		assert.ok(file, "backup download completed");
		const filename = path.join(directory, file);
		const downloaded = JSON.parse(readFileSync(filename, "utf8"));
		assert.equal(downloaded.version, 3);
		assert.equal(downloaded.bills.length, 8);
		assert.equal(Object.hasOwn(downloaded, "language"), false);
		await c("Page.setInterceptFileChooserDialog", { enabled: true });
		await clickText(language === "en" ? "Load from file" : "Загрузить из файла");
		const { root } = await c("DOM.getDocument");
		const { nodeId } = await c("DOM.querySelector", { nodeId: root.nodeId, selector: "input[type=file]" });
		assert.ok(nodeId);
		await c("DOM.setFileInputFiles", { nodeId, files: [filename] });
		await waitFor("!!document.querySelector('[role=alertdialog]')");
		await clickText(language === "en" ? "Replace data" : "Заменить данные");
		await sleep(500);
		await navigate("/settings");
		assert.equal(await evaluate("preferences.getSnapshot().language"), language);
		assert.equal(await evaluate("preferences.getSnapshot().numberFormat"), "space-dot");
		assert.equal(await evaluate("Object.keys(debtStore.getState().billsById).length"), 8);
	}
	await navigate("/settings");
	await evaluate(
		`(async () => { const { clearCreationDraftsWith } = await import('/src/entities/debt/index.ts'); const { wipeAppIndexedDatabase } = await import('/src/shared/lib/storage/index.ts'); await clearCreationDraftsWith(wipeAppIndexedDatabase); })()`,
	);
	await navigate("/settings");
	assert.equal(await evaluate("preferences.getSnapshot().language"), "en");
	assert.equal(await evaluate("preferences.getSnapshot().numberFormat"), "space-dot");
	assert.equal(await evaluate("Object.keys(debtStore.getState().debtsById).length"), 0);
	await evaluate(
		`(async () => { Object.defineProperty(navigator, 'languages', { configurable: true, value: ['de-DE'] }); const { clearAllClientStorage } = await import('/src/shared/lib/clear-client-storage.ts'); clearAllClientStorage(); })()`,
	);
	assert.equal(await evaluate("preferences.getSnapshot().language"), "en");
	assert.equal(await evaluate("preferences.getSnapshot().numberFormat"), "comma-dot");
	assert.equal(await evaluate("localStorage.getItem('debts.installBannerDismissed')"), null);
	assert.equal(await evaluate("document.title"), "Debts");
	assert.ok((await evaluate("document.body.innerText")).includes("$ Dollar"));
	await c("Page.addScriptToEvaluateOnNewDocument", {
		source:
			"Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException('Blocked', 'SecurityError'); } });",
	});
	await navigate("/settings");
	await evaluate("preferences.setLanguage('ru'); preferences.setNumberFormat('dot-comma')");
	assert.equal(await evaluate("document.title"), "Долги");
	assert.equal(await evaluate("preferences.getSnapshot().numberFormat"), "dot-comma");
	await evaluate(
		"import('/src/shared/lib/clear-client-storage.ts').then(m => { m.clearClientStoragePreferences(); return true; })",
	);
	assert.equal(await evaluate("document.title"), "Debts");
	await evaluate(`window.scrollTo(0, 0)`);
}
