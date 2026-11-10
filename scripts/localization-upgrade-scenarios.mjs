import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";

/** Два production-комплекта на одном origin: старый HEAD и текущий dist. Только изолированный профиль CDP. */
export async function run({ evaluate, c, sleep }) {
	assert.ok(process.env.LOCALIZATION_OLD_DIST, "Set LOCALIZATION_OLD_DIST to the previous build directory");
	let directory = path.resolve(process.env.LOCALIZATION_OLD_DIST);
	const types = {
		".js": "text/javascript",
		".css": "text/css",
		".html": "text/html",
		".json": "application/json",
		".webmanifest": "application/manifest+json",
		".svg": "image/svg+xml",
		".png": "image/png",
		".ico": "image/x-icon",
		".woff2": "font/woff2",
	};
	const server = createServer((request, response) => {
		const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
		let file = path.resolve(directory, `.${pathname}`);
		if (!file.startsWith(`${directory}${path.sep}`) && file !== directory) {
			response.writeHead(403).end();
			return;
		}
		if (!existsSync(file) || !statSync(file).isFile()) {
			if (!path.extname(pathname)) file = path.join(directory, "index.html");
			else {
				response.writeHead(404).end();
				return;
			}
		}
		response.setHeader("Content-Type", types[path.extname(file)] || "application/octet-stream");
		response.setHeader("Cache-Control", "no-cache");
		response.end(readFileSync(file));
	});
	await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
	const address = server.address();
	assert.ok(address && typeof address !== "string");
	const origin = `http://127.0.0.1:${address.port}`;
	const waitFor = async (expression) => {
		for (let i = 0; i < 300; i++) {
			if (await evaluate(expression)) return;
			await sleep(50);
		}
		throw Error(`Timed out: ${expression}; ${await evaluate("document.body.innerText")}`);
	};
	const navigate = async (pathname) => {
		await c("Page.navigate", { url: `${origin}${pathname}` });
		await waitFor("!!document.querySelector('h1')");
	};
	const click = async (text, selector = "button") =>
		evaluate(
			`(() => { const el = [...document.querySelectorAll(${JSON.stringify(selector)})].find(el => el.textContent.trim() === ${JSON.stringify(text)} && el.getBoundingClientRect().height); if (!el) throw Error('Missing ' + ${JSON.stringify(text)}); el.click(); })()`,
		);
	try {
		await c("Page.addScriptToEvaluateOnNewDocument", {
			source: `Object.defineProperty(navigator, 'languages', { configurable: true, value: ['en-US'] }); if (!sessionStorage.getItem('localization-test-seeded')) { sessionStorage.setItem('localization-test-seeded', '1'); localStorage.setItem('debts.displayCurrency', 'EUR'); localStorage.removeItem('debts.preferredDisplayCurrency'); }`,
		});
		await navigate("/");
		assert.equal(await evaluate("document.documentElement.lang"), "ru");
		await evaluate("navigator.serviceWorker.ready.then(() => true)");
		await evaluate(`new Promise((resolve, reject) => {
			const request = indexedDB.open('debts'); request.onerror = () => reject(request.error); request.onsuccess = () => {
				const db = request.result; const tx = db.transaction(['contacts', 'debts', 'debtOperations', 'creationDrafts'], 'readwrite');
				const createdAt = '2026-11-01T12:00:00.000Z';
				tx.objectStore('contacts').put({ id: 'old-contact', name: 'Анна До обновления', colorValue: '#3b82f6', createdAt, updatedAt: createdAt, archivedAt: null });
				tx.objectStore('debts').put({ id: 'old-debt', contactId: 'old-contact', currency: 'RUB', principalAmount: 1234.56, direction: 'owed_to_me', note: 'Старая заметка', status: 'active', billId: null, createdAt, updatedAt: createdAt, closedAt: null });
				tx.objectStore('debtOperations').put({ id: 'old-operation', debtId: 'old-debt', kind: 'initial', amount: 1234.56, note: null, createdAt });
				tx.objectStore('creationDrafts').put({ kind: 'debt', id: 'old-draft', version: 1, updatedAt: createdAt, payload: { contactId: 'old-contact', direction: 'i_owe', currency: 'THB', amount: '1234.', note: 'Черновик до обновления' } });
				tx.oncomplete = () => { db.close(); resolve(true); }; tx.onerror = () => reject(tx.error);
			};
		})`);
		await navigate("/new");
		await waitFor("document.querySelector('input[inputmode=decimal]')?.value.replaceAll(' ', ' ') === '1 234,'");
		directory = path.resolve("dist");
		await evaluate(
			"navigator.serviceWorker.getRegistration().then(registration => registration.update()).then(() => true)",
		);
		await waitFor("navigator.serviceWorker.getRegistration().then(registration => !!registration.waiting)");
		await evaluate(
			"navigator.serviceWorker.getRegistration().then(registration => { registration.waiting.postMessage({ type: 'SKIP_WAITING' }); return true; })",
		);
		await waitFor(
			"navigator.serviceWorker.getRegistration().then(registration => !registration.waiting && registration.active?.state === 'activated')",
		);
		await navigate("/");
		await waitFor("document.title === 'Debts'");
		assert.equal(await evaluate("localStorage.getItem('debts.displayCurrency')"), "EUR");
		assert.equal(await evaluate("localStorage.getItem('debts.preferredDisplayCurrency')"), "EUR");
		assert.ok((await evaluate("document.body.innerText")).includes("Анна До обновления"));
		await c("Network.emulateNetworkConditions", {
			offline: true,
			latency: 0,
			downloadThroughput: 0,
			uploadThroughput: 0,
		});
		await navigate("/settings");
		assert.ok((await evaluate("document.body.innerText")).includes("Interface language"));
		await click("Interface languageSystem default", 'button[aria-label^="Interface language:"]');
		await waitFor("!!document.querySelector('[role=dialog]')");
		await click("Русский", "label");
		await waitFor("!document.querySelector('[role=dialog]') && document.documentElement.lang === 'ru'");
		assert.equal(
			await evaluate("fetch('/site.webmanifest').then(response => response.json()).then(manifest => manifest.lang)"),
			"ru",
		);
		await click("Формат чисел1 234,56", 'button[aria-label^="Формат чисел:"]');
		await waitFor("!!document.querySelector('[role=dialog]')");
		await click("1 234.56", "label");
		await waitFor("!document.querySelector('[role=dialog]')");
		await click("Язык интерфейсаРусский", 'button[aria-label^="Язык интерфейса:"]');
		await waitFor("!!document.querySelector('[role=dialog]')");
		await click("English", "label");
		await waitFor("!document.querySelector('[role=dialog]') && document.title === 'Debts'");
		assert.equal(
			await evaluate("fetch('/site.en.webmanifest').then(response => response.json()).then(manifest => manifest.lang)"),
			"en",
		);
		await evaluate(
			"[...document.querySelectorAll('button')].find(el => el.getAttribute('aria-label')?.startsWith('Current display currency')).click()",
		);
		await waitFor("!!document.querySelector('[role=dialog] input')");
		await evaluate("document.querySelector('[role=dialog] input').focus()");
		await c("Input.insertText", { text: " BAHT " });
		await waitFor("document.querySelector('[role=dialog]').textContent.includes('Thai baht')");
		await click("Close");
		await waitFor("!document.querySelector('[role=dialog]')");
		await navigate("/bills/new");
		assert.ok((await evaluate("document.body.innerText")).includes("One amount"));
		await navigate("/settings/changelog");
		assert.ok((await evaluate("document.body.innerText")).includes("Version 2.4.0"));
		await navigate("/new");
		await waitFor("document.querySelector('input[inputmode=decimal]')?.value === '1 234.'");
		const records = await evaluate(
			`new Promise((resolve, reject) => { const req = indexedDB.open('debts'); req.onerror = () => reject(req.error); req.onsuccess = () => { const db = req.result; const tx = db.transaction(['debts', 'creationDrafts']); const debt = tx.objectStore('debts').get('old-debt'); const draft = tx.objectStore('creationDrafts').get('debt'); tx.oncomplete = () => { resolve({ debt: debt.result, draft: draft.result }); db.close(); }; }; })`,
		);
		assert.equal(records.debt.principalAmount, 1234.56);
		assert.equal(records.debt.note, "Старая заметка");
		assert.equal(records.draft.payload.amount, "1234.");
		assert.equal(records.draft.payload.currency, "THB");
		assert.equal(records.draft.payload.note, "Черновик до обновления");
		console.log("OK production upgrade and first offline visits, both manifests and normalized draft");
	} finally {
		await c("Network.emulateNetworkConditions", {
			offline: false,
			latency: 0,
			downloadThroughput: -1,
			uploadThroughput: -1,
		});
		await new Promise((resolve) => server.close(resolve));
	}
}
