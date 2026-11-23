import assert from "node:assert/strict";

export async function run({ evaluate, c, sleep }) {
	const origin = new URL(await evaluate("location.href")).origin;
	if (process.env.SETTLEMENT_DESKTOP) {
		await c("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
	}
	const wait = async (expression) => {
		for (let i = 0; i < 100; i++) {
			if (await evaluate(expression)) return;
			await sleep(50);
		}
		throw Error(`Не дождались: ${expression}\n${await evaluate("document.body.innerText")}`);
	};
	const dialog = "document.querySelector('[role=dialog]')";
	const bodyHas = (text) => `document.body.innerText.includes(${JSON.stringify(text)})`;
	const input = `${dialog}?.querySelector('input[inputmode=decimal]')`;
	const find = (text, selector = "button") =>
		`[...document.querySelectorAll(${JSON.stringify(selector)})].find(e => e.textContent.trim() === ${JSON.stringify(text)} && e.getBoundingClientRect().height)`;
	const click = async (text, selector) => {
		const el = find(text, selector);
		await wait(`!!(${el})`);
		if (!selector) {
			await evaluate(`(() => { const el = ${el}; el.focus(); el.click(); })()`);
			return;
		}
		await sleep(300);
		const rect = await evaluate(
			`(() => { const e = ${el}; e.scrollIntoView({block:'nearest'}); const r = e.getBoundingClientRect(); return { x:r.x+r.width/2, y:r.y+r.height/2 }; })()`,
		);
		await c("Input.dispatchMouseEvent", { type: "mousePressed", button: "left", clickCount: 1, ...rect });
		await c("Input.dispatchMouseEvent", { type: "mouseReleased", button: "left", clickCount: 1, ...rect });
	};
	const enter = async (text) => {
		await evaluate(`${input}.focus()`);
		await evaluate(`${input}.select()`);
		await c("Input.insertText", { text });
	};
	await evaluate(`(async () => {
		localStorage.setItem('debts.language', 'ru');
		const { getStorageAdapter } = await import('/src/shared/lib/storage/index.ts');
		const storage = getStorageAdapter();
		const stamp = new Date().toISOString();
		const contact = (id, name) => ({id, name, colorValue:'#3b82f6', createdAt:stamp, updatedAt:stamp, archivedAt:null});
		const debt = (id, contactId, direction, principalAmount, currency='RUB', billId=null) => ({
			id, contactId, direction, principalAmount, currency, status:'active', billId,
			note:id, createdAt:stamp, updatedAt:stamp, closedAt:null,
		});
		const debts = [debt('Ужин','anna','i_owe',800,'RUB','dinner'), debt('Такси','anna','owed_to_me',215),
			debt('Евро','anna','i_owe',10,'EUR'), debt('Первый','even','i_owe',500), debt('Второй','even','owed_to_me',500),
			debt('Один','single','i_owe',485), debt('Чек','receipt','i_owe',100,'RUB','receipt-bill')];
		const bill = { id:'dinner', title:'Ужин', currency:'RUB', totalAmount:1600, splitMode:'equal',
			participants:[{ref:'me',paid:0,inSplit:true,shareInput:null},{ref:'anna',paid:1600,inSplit:true,shareInput:null}],
			items:[],discount:null,tips:null,manualClosedAt:null,createdAt:stamp,updatedAt:stamp };
		const receipt = { ...bill,id:'receipt-bill',title:'Чек',totalAmount:200,splitMode:'items',
			participants:[{ref:'me',paid:0,inSplit:true,shareInput:null},{ref:'receipt',paid:200,inSplit:true,shareInput:null}],
			items:[{id:'coffee',title:'Кофе',price:200,refs:['me','receipt'],extraPeople:0}] };
		await storage.replaceAll({contacts:[contact('anna','Анна'),contact('even','Борис'),contact('single','Катя'),contact('none','Олег'),contact('receipt','Иван')],
			debts,bills:[bill,receipt],contactSettlements:[],meta:{schemaVersion:4,ratesCache:null},debtOperations:[
				...debts.map(d=>({id:'init-'+d.id,debtId:d.id,kind:'initial',amount:d.principalAmount,note:null,createdAt:stamp})),
				{id:'partial',debtId:'Ужин',kind:'repayment',amount:100,note:null,createdAt:stamp},
			]});
		return true;
	})()`);
	const navigate = async (route, text) => {
		await c("Page.navigate", { url: `${origin}${route}` });
		await wait(bodyHas(text));
	};
	await navigate("/contacts/none", "Олег");
	assert.equal(await evaluate(`!!(${find("Рассчитаться")})`), false);
	await navigate("/contacts/single", "Катя");
	assert.equal(await evaluate(bodyHas("Погасить")), true);
	await click("Рассчитаться");
	await wait(`${input}?.value === '485'`);
	await click("Вам передали");
	await wait(`${input}?.value === ''`);
	await wait(`${find("Подтвердить расчёт")}?.disabled === true`);
	await enter("0");
	await wait(bodyHas("Без встречных долгов"));
	await click("Отмена");
	await wait(`!${dialog}`);
	await navigate("/contacts/even", "Борис");
	await click("Рассчитаться");
	await wait(bodyHas("Деньги не передавали"));
	assert.equal(await evaluate(`!!(${input})`), false);
	await click("Указать сумму");
	await click("Вам передали");
	await enter("100");
	await wait(bodyHas("Вы будете должны 100"));
	await click("Деньги не передавали");
	await click("Подтвердить расчёт");
	await wait(`!(${find("Рассчитаться")})`);

	await navigate("/contacts/anna", "Анна");
	await evaluate("import('/src/shared/lib/storage/index.ts').then(() => true)");
	await c("Network.emulateNetworkConditions", {
		offline: true,
		latency: 0,
		downloadThroughput: 0,
		uploadThroughput: 0,
	});
	await click("Рассчитаться");
	await wait(bodyHas("Выберите валюту"));
	await click("Выберите валюту", "[role=combobox]");
	await click("EUR", "[role=option]");
	await wait(`${input}?.value === '10'`);
	await click("EUR", "[role=combobox]");
	await click("RUB", "[role=option]");
	await wait(`${input}?.value === '485'`);
	await click("Закроются 2 долга");
	await wait(`${dialog}?.innerText.includes('Ужин')`);
	await enter("450");
	await wait(bodyHas("Вы будете должны 35"));
	await enter("485");
	await wait(bodyHas("Долгов в RUB не останется"));
	await enter("500");
	await wait(bodyHas("Вам будут должны 15"));
	await evaluate(`(() => {
		const add = IDBObjectStore.prototype.add;
		IDBObjectStore.prototype.add = function (...args) {
			if (this.name === 'contactSettlements') throw Error('Failed test write');
			return add.apply(this, args);
		};
		window.restoreSettlementWrite = () => { IDBObjectStore.prototype.add = add; };
	})()`);
	await click("Подтвердить расчёт");
	await wait(bodyHas("Не удалось сохранить"));
	await evaluate("window.restoreSettlementWrite()");
	await evaluate(`(async () => {
		const { getStorageAdapter } = await import('/src/shared/lib/storage/index.ts');
		const storage = getStorageAdapter();
		const source = (await storage.getAllDebts()).find(d => d.id === 'Такси');
		await storage.putDebtWithOperation({...source,id:'extra',principalAmount:1},
			{id:'init-extra',debtId:'extra',amount:1,kind:'initial',note:null,createdAt:source.createdAt});
		return true;
	})()`);
	await click("Подтвердить расчёт");
	await wait(bodyHas("Открытые долги изменились"));
	await wait(`${input}?.value === '484'`);
	await enter("500");
	await wait(bodyHas("Вам будут должны 16"));
	await click("Подтвердить расчёт");
	await wait(`!${dialog}`);
	await wait(bodyHas("Открытые 2"));
	const article = `[...document.querySelectorAll('article')].find(e => e.innerText.includes('16'))`;
	await evaluate(`(${article}).querySelector('button[data-state=closed]').click()`);
	await click("Возник из расчёта");
	await wait(bodyHas("Вам остались должны 16"));
	await wait(bodyHas("Вы передали 500"));
	await click("Закрыть");
	await wait(`!${dialog}`);
	await c("Network.emulateNetworkConditions", {
		offline: false,
		latency: 0,
		downloadThroughput: -1,
		uploadThroughput: -1,
	});
	await wait("document.activeElement?.textContent === 'Возник из расчёта'");
	await click("Рассчитаться");
	await click("Выберите валюту", "[role=combobox]");
	await click("RUB", "[role=option]");
	await wait(`${input}?.value === '16'`);
	await click("Подтвердить расчёт");
	await wait(`!${dialog}`);
	await wait(bodyHas("Открытые 1"));
	await evaluate(`(${article}).querySelector('button[data-state=closed]').click()`);
	const historyButton = (text) =>
		`[...(${article}).querySelectorAll('button')].find(e => e.textContent.trim() === ${JSON.stringify(text)})`;
	await evaluate(`(${historyButton("Закрыт общим расчётом")}).click()`);
	await wait(`${dialog}?.innerText.includes('Долгов не осталось')`);
	await click("Закрыть");
	await wait(`!${dialog}`);
	await evaluate(`(${historyButton("Возник из расчёта")}).click()`);
	await wait(`${dialog}?.innerText.includes('Вам остались должны 16')`);
	await click("Закрыть");
	await wait(`!${dialog}`);
	await evaluate("localStorage.setItem('debts.language', 'en')");
	await navigate("/contacts/anna", "Settle up");
	await evaluate(`(${article}).querySelector('button[data-state=closed]').click()`);
	await click("Created by a settlement");
	await wait(`${dialog}?.innerText.includes('You were still owed 16')`);
	await click("Close");
	await wait(`!${dialog}`);
	await evaluate("localStorage.setItem('debts.language', 'ru')");
	await navigate("/bills/dinner", "Ужин");
	await wait(bodyHas("все ваши обязательства по счёту закрыты"));
	await wait("!!document.querySelector('[aria-label^=\"Закрыто 800\"]')");
	await click("Закрыт общим расчётом");
	await wait(`${dialog}?.innerText.includes('Вы передали 500')`);
	await click("Закрыть");
	await wait(`!${dialog}`);
	await navigate("/bills/dinner/edit", "Изменить счёт");
	await wait(bodyHas("Можно изменить только описание"));
	await evaluate(`(async () => {
		const { useDebtStore } = await import('/src/entities/debt/model/debt-store.ts');
		await useDebtStore.getState().hydrate();
		const state = useDebtStore.getState();
		const bill = state.billsById.dinner;
		if (await state.updateBill('dinner', {...bill, totalAmount: 1234})) throw Error('Финансовая правка неожиданно разрешена');
		if (!await state.updateBill('dinner', {...bill, title: 'Ужин после правки'})) {
			throw Error('Не сохранилось описание: ' + useDebtStore.getState().lastError);
		}
		const snapshot = Object.values(useDebtStore.getState().settlementsById).find(s => s.debts.some(d => d.debtId === 'Ужин'));
		if (!snapshot.debts.some(d => d.label === 'Ужин')) throw Error('Историческая подпись изменилась');
		return true;
	})()`);
	await navigate("/bills/receipt-bill", "Чек");
	await wait(bodyHas("Возвращено"));
	await navigate("/contacts/receipt", "Иван");
	await click("Рассчитаться");
	await wait(`${input}?.value === '100'`);
	await click("Подтвердить расчёт");
	await wait(`!${dialog}`);
	await navigate("/bills/receipt-bill/edit", "Изменить счёт");
	await wait(bodyHas("Можно изменить только описание"));
	await wait("[...document.querySelectorAll('input')].some(input => input.value === 'Кофе' && input.disabled)");

	await evaluate("import('/src/shared/lib/storage/index.ts').then(() => true)");
	await c("Network.emulateNetworkConditions", {
		offline: true,
		latency: 0,
		downloadThroughput: 0,
		uploadThroughput: 0,
	});
	const restored = await evaluate(`(async () => {
		const { createDebtsBackup, getStorageAdapter, parseDebtsBackup, restoreDebtsFromBackup } = await import('/src/shared/lib/storage/index.ts');
		const backup = await createDebtsBackup();
		await getStorageAdapter().replaceAll({contacts:[],debts:[],debtOperations:[],bills:[],contactSettlements:[],meta:backup.meta});
		await restoreDebtsFromBackup(parseDebtsBackup(JSON.stringify(backup)));
		const current = await getStorageAdapter().readAll();
		return {
			open:current.debts.filter(d=>d.contactId==='anna' && d.status==='active').map(d=>[d.id,d.currency,d.principalAmount]),
			settlements:current.contactSettlements.filter(s=>s.contactId==='anna').length,
		};
	})()`);
	assert.deepEqual(restored, { open: [["Евро", "EUR", 10]], settlements: 2 });
	await c("Network.emulateNetworkConditions", {
		offline: false,
		latency: 0,
		downloadThroughput: -1,
		uploadThroughput: -1,
	});
	await navigate("/", "Анна");
	await wait(bodyHas("10 €"));
	await navigate("/bills/dinner", "Ужин после правки");
	await click("Закрыт общим расчётом");
	await wait(`${dialog}?.innerText.includes('Вам остались должны 16')`);
	await wait(`${dialog}?.innerText.includes('Ужин')`);
}
