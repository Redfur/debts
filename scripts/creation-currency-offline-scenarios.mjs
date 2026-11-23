import assert from "node:assert/strict";

/** Прогон на `npm run preview` через check-drawers.mjs (DRAWER_TEST_URL — корень приложения). */
export async function run({ evaluate, c, sleep }) {
	const wait = async (expression) => {
		for (let i = 0; i < 100; i++) {
			if (await evaluate(expression)) return;
			await sleep(50);
		}
		assert.fail(`Не дождались ${expression}\n${await evaluate("document.body.innerText")}`);
	};
	const origin = new URL(await evaluate("location.href")).origin;
	const button = (text) =>
		`[...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(text)} && b.getClientRects().length)`;
	const currency = (symbol) =>
		`[...document.querySelectorAll('button[aria-label^="Валюта:"]')].some(b => b.textContent.includes(${JSON.stringify(symbol)}))`;
	const navigate = async (route, condition) => {
		await c("Page.navigate", { url: `${origin}${route}` });
		await wait(condition);
	};
	await evaluate(`(async () => {
		await navigator.serviceWorker.ready;
		localStorage.setItem('debts.language', 'ru');
		localStorage.setItem('debts.displayCurrency', 'USD');
		localStorage.setItem('debts.preferredDisplayCurrency', 'USD');
		const r = indexedDB.open('debts');
		const db = await new Promise((resolve, reject) => { r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
		const tx = db.transaction(['contacts','bills','meta'], 'readwrite');
		const stamp = new Date().toISOString();
		const person = id => ({id,name:id === 'anna' ? 'Анна' : 'Борис',colorValue:'#3b82f6',
			createdAt:stamp,updatedAt:stamp,archivedAt:null});
		tx.objectStore('contacts').put(person('anna'));
		tx.objectStore('contacts').put(person('boris'));
		tx.objectStore('bills').put({id:'dinner',title:'Ужин',currency:'THB',totalAmount:100,splitMode:'equal',
			participants:[{ref:'anna',paid:100,inSplit:true,shareInput:null},{ref:'boris',paid:0,inSplit:true,shareInput:null}],
			items:[],discount:null,tips:null,manualClosedAt:null,createdAt:stamp,updatedAt:stamp});
		tx.objectStore('meta').put({key:'lastCreationCurrency',currency:'THB'});
		tx.objectStore('meta').put({key:'app',schemaVersion:4,ratesCache:{base:'USD',date:stamp.slice(0,10),fetchedAt:stamp,rates:{USD:1}}});
		await new Promise((resolve,reject) => { tx.oncomplete = resolve; tx.onabort = () => reject(tx.error); });
		db.close();
	})()`);
	await c("Page.reload");
	await wait("!!navigator.serviceWorker?.controller");
	await c("Network.emulateNetworkConditions", {
		offline: true,
		latency: 0,
		downloadThroughput: 0,
		uploadThroughput: 0,
	});
	await navigate("/new?contactId=anna", currency("฿"));
	assert.equal(await evaluate("navigator.onLine"), false);
	assert.equal(
		await evaluate(`(async () => {
		const r = indexedDB.open('debts');
		const db = await new Promise(resolve => { r.onsuccess = () => resolve(r.result); });
		const read = db.transaction('creationDrafts').objectStore('creationDrafts').count();
		const count = await new Promise(resolve => { read.onsuccess = () => resolve(read.result); });
		db.close();
		return count;
	})()`),
		0,
	);
	await evaluate(`document.querySelector('button[aria-label^="Валюта:"]').click()`);
	await wait(`!!document.querySelector('label[for$="-EUR"]')`);
	await evaluate(`document.querySelector('label[for$="-EUR"]').click()`);
	await wait(currency("€"));
	await evaluate(`document.querySelector('input[inputmode=decimal]').focus()`);
	await c("Input.insertText", { text: "100" });
	await wait(`!!(${button("Создать долг")}) && !(${button("Создать долг")}).disabled`);
	await evaluate(`${button("Создать долг")}.click()`);
	await wait(`location.pathname === '/contacts/anna'`);
	await navigate("/bills/new", currency("€"));
	await evaluate(`document.querySelector('button[aria-label^="Валюта:"]').click()`);
	await wait(`!!document.querySelector('label[for$="-KZT"]')`);
	await evaluate(`document.querySelector('label[for$="-KZT"]').click()`);
	await wait(currency("₸"));
	await wait(`document.body.innerText.includes('Черновик сохранён')`);
	await c("Page.reload");
	await wait(currency("₸"));
	await navigate("/bills/dinner/edit", currency("฿"));
	await navigate("/new?contactId=boris", currency("€"));
	assert.equal(await evaluate("localStorage.getItem('debts.displayCurrency')"), "USD");
	assert.equal(await evaluate("localStorage.getItem('debts.preferredDisplayCurrency')"), "USD");
}
