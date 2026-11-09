import assert from "node:assert/strict";

/** Прогон по настоящей production PWA: без dev-стенда и импортов исходников. */
export async function run({ evaluate: e, c, sleep, requests }) {
	const nav = async (path) => {
		await e(`history.pushState({},'',${JSON.stringify(path)});window.dispatchEvent(new PopStateEvent('popstate'))`);
		await sleep(600);
	};
	const click = async (label) => {
		await e(
			`(()=>{const b=[...document.querySelectorAll('button,a')].find(x=>(x.textContent.trim().startsWith(${JSON.stringify(label)})||x.getAttribute('aria-label')?.startsWith(${JSON.stringify(label)}))&&x.getBoundingClientRect().width);if(!b)throw Error(${JSON.stringify(label)});b.focus();b.click()})()`,
		);
		await sleep(400);
	};
	const swipe = async () => {
		const p = await e(
			`(()=>{const r=[...document.querySelectorAll('[data-slot=drawer-handle]')].at(-1).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+20}})()`,
		);
		await c("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [p] });
		for (let i = 1; i <= 10; i++) {
			await c("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: p.x, y: p.y + i * 40 }] });
			await sleep(20);
		}
		await c("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
		await sleep(400);
	};
	await c("Emulation.setTouchEmulationEnabled", { enabled: true });
	await e("navigator.serviceWorker.ready.then(()=>true)");
	// Свежий кэш исключает штатные попытки обновления курса при последующих перезагрузках.
	await e(
		`(async()=>{const r=indexedDB.open('debts');const db=await new Promise(resolve=>{r.onsuccess=()=>resolve(r.result)});const tx=db.transaction('meta','readwrite');const now=new Date().toISOString();tx.objectStore('meta').put({key:'app',schemaVersion:3,ratesCache:{base:'USD',date:now.slice(0,10),fetchedAt:now,rates:{USD:1,RUB:90,THB:30}}});await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});db.close()})()`,
	);
	await c("Page.reload");
	await sleep(1000);
	assert.equal(await e("!!navigator.serviceWorker.controller"), true);
	const start = requests.length;
	await c("Network.emulateNetworkConditions", {
		offline: true,
		latency: 0,
		downloadThroughput: 0,
		uploadThroughput: 0,
	});
	await nav("/settings");
	await click("Предпочитаемая");
	assert.equal(await e(`document.querySelectorAll('[role=dialog] [role=radio]').length`), 155);
	await e(`document.querySelector('input[type=search]').focus()`);
	await c("Input.insertText", { text: "THB" });
	await sleep(150);
	await e(`document.querySelector('label[for$="-THB"]').click()`);
	await sleep(400);
	assert.equal(await e('localStorage.getItem("debts.preferredDisplayCurrency")'), "THB");
	await c("Page.reload");
	await sleep(1000);
	assert.ok((await e("document.body.innerText")).includes("฿ Бат"));
	await click("Текущая валюта");
	await swipe();
	assert.equal(await e(`document.querySelectorAll('[role=dialog]').length`), 0);
	await nav("/settings/changelog");
	assert.ok((await e("document.body.innerText")).includes("История изменений"));
	assert.ok((await e("document.body.innerText")).includes("Версия 2.4.0"));
	assert.ok(!(await e("document.body.innerText")).includes("Unreleased"));
	await nav("/new");
	await e(`document.querySelector('input[enterkeyhint=done]:not([role=combobox])').focus()`);
	await c("Input.insertText", { text: "Сохранённый черновик" });
	await sleep(700);
	const draftSnapshot = () =>
		e(
			`(async()=>{const r=indexedDB.open('debts');const db=await new Promise(resolve=>{r.onsuccess=()=>resolve(r.result)});const get=db.transaction('creationDrafts').objectStore('creationDrafts').get('debt');const value=await new Promise(resolve=>{get.onsuccess=()=>resolve(get.result)});db.close();return JSON.stringify(value)})()`,
		);
	const beforeDraft = await draftSnapshot();
	assert.ok(beforeDraft?.includes("Сохранённый черновик"));
	await click("Валюта:");
	await swipe();
	assert.equal(await draftSnapshot(), beforeDraft);
	await nav("/bills/new");
	await click("Валюта:");
	await swipe();
	await nav("/settings");
	await click("Сбросить настройки интерфейса");
	assert.equal(await e(`document.querySelector('[role=alertdialog]').dataset.modalBackend`), "drawer");
	await swipe();
	assert.equal(await e('localStorage.getItem("debts.preferredDisplayCurrency")'), "THB");
	// Заполняем только новый изолированный профиль через тот же IndexedDB-контракт.
	await e(
		`(async()=>{const request=indexedDB.open('debts'); const db=await new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)});const tx=db.transaction(['contacts','debts','debtOperations'],'readwrite');const now=new Date().toISOString();tx.objectStore('contacts').put({id:'drawer-contact',name:'Анна',colorValue:'#e4e6fb',createdAt:now,updatedAt:now,archivedAt:null});tx.objectStore('debts').put({id:'drawer-debt',contactId:'drawer-contact',direction:'owed_to_me',currency:'RUB',principalAmount:1000,note:'Офлайн',status:'active',createdAt:now,updatedAt:now,closedAt:null,billId:null});tx.objectStore('debtOperations').put({id:'drawer-operation',debtId:'drawer-debt',kind:'initial',amount:1000,note:null,createdAt:now});await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});db.close()})()`,
	);
	await nav("/contacts/drawer-contact");
	await c("Page.reload");
	await sleep(1000);
	await click("Изменить");
	await click("Валюта:");
	assert.equal(await e(`document.querySelectorAll('[role=dialog]').length`), 2);
	await swipe();
	assert.equal(await e(`document.querySelectorAll('[role=dialog]').length`), 1);
	await swipe();
	await click("Погасить");
	await swipe();
	assert.equal(await e(`document.querySelectorAll('[role=dialog]').length`), 0);
	const external = requests.slice(start).filter((url) => /^https?:/.test(url) && !url.startsWith("http://127.0.0.1:"));
	assert.deepEqual(external, []);
	console.log(
		"PASS production offline: lazy screens, 155 currencies/search/THB persistence, changelog, reset cancellation, nested edit and repayment swipe; no external runtime requests",
	);
}
