import assert from "node:assert/strict";

export async function run({ evaluate, c, sleep }) {
	const result = await evaluate(`(async () => {
		const { getStorageAdapter, createDebtsBackup } = await import('/src/shared/lib/storage/index.ts');
		const { readInitialCreationCurrency: read } = await import('/src/entities/debt/model/creation-currency.ts');
		const storage = getStorageAdapter();
		const createdAt = '2026-11-03T10:00:00Z';
		const updatedAt = '2026-11-20T10:00:00Z';
		const debt = {id:'debt', contactId:'anna', direction:'owed_to_me', principalAmount:100, status:'active',
			currency:'RUB', note:null, billId:null, createdAt, updatedAt, closedAt:null};
		const op = {id:'op', debtId:debt.id, kind:'initial', createdAt, amount:100, note:null};
		const bill = {id:'bill', title:null, currency:'KZT', totalAmount:100, splitMode:'equal',
			participants:[], items:[], discount:null, tips:null, manualClosedAt:null, createdAt:'2026-11-04T10:00:00Z', updatedAt};
		const empty = {contacts:[], debts:[], debtOperations:[], bills:[], contactSettlements:[],
			meta:{schemaVersion:4,ratesCache:null}};
		await storage.replaceAll(empty);
		const fallback = await read();
		await storage.replaceAll({...empty, bills:[bill], debts:[debt,
			{...debt,id:'from-bill',billId:bill.id,currency:'USD',createdAt:updatedAt},
			{...debt,id:'difference',currency:'GBP',createdAt:updatedAt}],
			debtOperations:[op,{...op,id:'delta-op',debtId:'difference',settlementId:'settlement'}]});
		const newest = await read();
		const freshBill = {...bill,id:'new-bill',currency:'THB'};
		await storage.putBillWithDebts(freshBill, [], [], []);
		const afterBill = await read();
		await storage.putBillWithDebts({...freshBill,currency:'JPY'}, [], [], [], undefined, {bill:freshBill,debts:[]});
		await storage.updateDebt({...debt,currency:'USD'}, debt, op);
		await storage.commitContactSettlement('anna', () => ({
			settlement:{id:'settlement'}, debts:[{...debt,id:'extra-debt',currency:'CHF'}], operations:[],
		}));
		await storage.setMeta({schemaVersion:4,ratesCache:null});
		const afterOtherActions = await read();
		const newDebt = {...debt,id:'new-debt',currency:'EUR'};
		await storage.putDebtWithOperation(newDebt, {...op,id:'new-op',debtId:newDebt.id});
		const afterDebt = await read();
		const put = IDBObjectStore.prototype.put;
		let failed = false;
		try {
			IDBObjectStore.prototype.put = function (value, ...args) {
				if (this.name === 'meta' && value.key === 'lastCreationCurrency') throw Error('Test failed write');
				return put.call(this, value, ...args);
			};
			await storage.putBillWithDebts({...bill,id:'rolled-back',currency:'CAD'}, [], [], []);
		} catch { failed = true; }
		finally { IDBObjectStore.prototype.put = put; }
		const afterFailure = await read();
		const noPartialWrite = !(await storage.getAllBills()).some(b => b.id === 'rolled-back');
		const backup = await createDebtsBackup();
		return {fallback,newest,afterBill,afterOtherActions,afterDebt,failed,afterFailure,noPartialWrite,
			noPreferenceInBackup:!JSON.stringify(backup).includes('lastCreationCurrency')};
	})()`);
	assert.deepEqual(result, {
		fallback: "RUB",
		newest: "KZT",
		afterBill: "THB",
		afterOtherActions: "THB",
		afterDebt: "EUR",
		failed: true,
		afterFailure: "EUR",
		noPartialWrite: true,
		noPreferenceInBackup: true,
	});
	const origin = new URL(await evaluate("location.href")).origin;
	await c("Page.navigate", { url: `${origin}/` });
	await sleep(600);
	assert.equal(
		await evaluate(
			"import('/src/entities/debt/model/creation-currency.ts').then(m => m.readInitialCreationCurrency())",
		),
		"EUR",
	);
}
