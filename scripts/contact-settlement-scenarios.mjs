import assert from "node:assert/strict";

/** Запуск: DRAWER_TEST_URL=http://127.0.0.1:4189/scripts/drawer-fixture.html node scripts/check-drawers.mjs ./contact-settlement-scenarios.mjs */
export async function run({ evaluate, c }) {
	const result = await evaluate(`(async () => {
		const { getStorageAdapter, wipeAppIndexedDatabase } = await import('/src/shared/lib/storage/indexed-db-adapter.ts');
		await wipeAppIndexedDatabase();
		const open = indexedDB.open('debts', 3);
		const legacy = await new Promise((resolve, reject) => {
			open.onupgradeneeded = () => {
				const db = open.result;
				db.createObjectStore('contacts', { keyPath: 'id' });
				const debts = db.createObjectStore('debts', { keyPath: 'id' });
				debts.createIndex('by-contactId', 'contactId');
				debts.createIndex('by-billId', 'billId');
				db.createObjectStore('debtOperations', { keyPath: 'id' }).createIndex('by-debtId', 'debtId');
				db.createObjectStore('bills', { keyPath: 'id' });
				db.createObjectStore('meta', { keyPath: 'key' });
				db.createObjectStore('creationDrafts', { keyPath: 'kind' });
			};
			open.onsuccess = () => resolve(open.result);
			open.onerror = () => reject(open.error);
		});
		const createdAt = '2026-11-01T12:00:00.000Z';
		const tx = legacy.transaction(['contacts', 'debts', 'debtOperations', 'bills', 'creationDrafts'], 'readwrite');
		tx.objectStore('contacts').put({ id: 'anna', name: 'Анна', createdAt, updatedAt: createdAt, archivedAt: null });
		tx.objectStore('debts').put({ id: 'old-debt', contactId: 'anna', currency: 'RUB', direction: 'owed_to_me',
			principalAmount: 600, billId: 'old-bill', status: 'active', createdAt, updatedAt: createdAt, closedAt: null });
		tx.objectStore('debtOperations').put({ id: 'old-payment', debtId: 'old-debt', kind: 'repayment', amount: 100, note: 'Перевод', createdAt });
		tx.objectStore('bills').put({ id: 'old-bill', title: 'Ужин', currency: 'RUB' });
		tx.objectStore('creationDrafts').put({ kind: 'debt', id: 'old-draft' });
		await new Promise((resolve, reject) => {
			tx.oncomplete = resolve;
			tx.onerror = () => reject(tx.error);
		});
		legacy.close();
		const storage = getStorageAdapter();
		const [debts, operations, bills, draft, settlements, meta] = await Promise.all([
			storage.getAllDebts(), storage.getAllDebtOperations(), storage.getAllBills(),
			storage.getCreationDraft('debt'), storage.getAllContactSettlements(), storage.getMeta(),
		]);
		return { debts, operations, bills, draft, settlements, meta };
	})()`);
	assert.equal(result.meta.schemaVersion, 4);
	assert.deepEqual(result.settlements, []);
	assert.equal(result.debts[0].billId, "old-bill");
	assert.equal(result.debts[0].principalAmount, 600);
	assert.equal(result.operations[0].kind, "repayment");
	assert.equal(result.operations[0].note, "Перевод");
	assert.equal(result.bills[0].title, "Ужин");
	assert.equal(result.draft.id, "old-draft");

	const writes = await evaluate(`(async () => {
		const { getStorageAdapter } = await import('/src/shared/lib/storage/indexed-db-adapter.ts');
		const { useDebtStore } = await import('/src/entities/debt/model/debt-store.ts');
		const { computeSettlementBasis } = await import('/src/entities/debt/model/compute-contact-settlement.ts');
		const storage = getStorageAdapter();
		const oldDebt = (await storage.getAllDebts())[0];
		const oldPayment = (await storage.getAllDebtOperations())[0];
		await useDebtStore.getState().hydrate();
		const basis = () => {
			const state = useDebtStore.getState();
			return computeSettlementBasis('anna', 'RUB', Object.values(state.debtsById), state.operationsByDebtId);
		};
		const preview = basis();
		const transfer = { direction: 'received', cents: 50_100 };
		let aborted = false;
		try {
			await storage.commitContactSettlement('anna', () => ({
				settlement: { id: 'should-rollback' },
				debts: [{ ...oldDebt, status: 'closed' }],
				operations: [oldPayment],
			}));
		} catch { aborted = true; }
		const rollback = (await storage.getAllDebts())[0].status === 'active'
			&& (await storage.getAllContactSettlements()).length === 0;
		const newDebt = { ...oldDebt, id: 'small', principalAmount: 1, billId: null };
		await storage.putDebtWithOperation(newDebt, { ...oldPayment, id: 'small-init', debtId: 'small', kind: 'initial', amount: 1 });
		const stale = await useDebtStore.getState().settleContact('anna', 'RUB', preview, transfer);
		const current = basis();
		const concurrent = await Promise.all([
			useDebtStore.getState().settleContact('anna', 'RUB', current, transfer),
			useDebtStore.getState().settleContact('anna', 'RUB', current, transfer),
		]);
		let rejected = false;
		try {
			await storage.updateDebt({ ...oldDebt, status: 'active' }, oldDebt, { ...oldPayment, id: 'not-written' });
		} catch { rejected = true; }
		return {
			aborted, rollback, stale, concurrent, rejected,
			debts: await storage.getAllDebts(), operations: await storage.getAllDebtOperations(),
			settlements: await storage.getAllContactSettlements(),
		};
	})()`);
	assert.equal(writes.aborted, true);
	assert.equal(writes.rollback, true);
	assert.equal(writes.stale, "changed");
	assert.deepEqual(writes.concurrent.toSorted(), ["changed", "saved"]);
	assert.equal(writes.rejected, true);
	assert.equal(writes.debts.length, 2);
	assert.ok(writes.debts.every((debt) => debt.status === "closed"));
	assert.equal(writes.settlements.length, 1);
	assert.equal(writes.operations.filter((op) => op.kind === "settlement_close").length, 2);
	assert.equal(writes.operations.find((op) => op.id === "old-payment").amount, 100);
	assert.ok(writes.operations.every((op) => op.id !== "not-written"));

	await evaluate("import('/src/shared/lib/storage/backup.ts').then(() => true)");
	await c("Network.emulateNetworkConditions", {
		offline: true,
		latency: 0,
		downloadThroughput: 0,
		uploadThroughput: 0,
	});
	const deletion = await evaluate(`(async () => {
		const { getStorageAdapter } = await import('/src/shared/lib/storage/indexed-db-adapter.ts');
		const { createDebtsBackup, parseDebtsBackup, restoreDebtsFromBackup } = await import('/src/shared/lib/storage/backup.ts');
		const storage = getStorageAdapter();
		const first = await storage.deleteBillCascade('old-bill');
		const remaining = await storage.getAllContactSettlements();
		const liveDebts = (await storage.getAllDebts()).map(debt => debt.id);
		const backup = await createDebtsBackup();
		const corrupted = structuredClone(backup);
		corrupted.debtOperations.find(op => op.kind === 'settlement_close').settlementId = 'missing';
		let rejected = false;
		try { await restoreDebtsFromBackup(parseDebtsBackup(JSON.stringify(corrupted))); } catch { rejected = true; }
		const retained = await storage.getAllContactSettlements();
		const last = await storage.deleteDebt('small');
		const after = await storage.getAllContactSettlements();
		await restoreDebtsFromBackup(parseDebtsBackup(JSON.stringify(backup)));
		const restored = await storage.getAllContactSettlements();
		const versions = [];
		for (const version of [1, 2, 3]) {
			const legacy = { ...backup, version, debtOperations: [] };
			delete legacy.contactSettlements;
			if (version === 1) delete legacy.bills;
			await restoreDebtsFromBackup(parseDebtsBackup(JSON.stringify(legacy)));
			versions.push([(await storage.getAllDebts()).length, (await storage.getAllContactSettlements()).length]);
		}
		return { first, remaining, liveDebts, last, after, rejected, retained, restored, versions, version: backup.version };
	})()`);
	assert.deepEqual(deletion.first, []);
	assert.deepEqual(deletion.remaining, writes.settlements);
	assert.deepEqual(deletion.liveDebts, ["small"]);
	assert.deepEqual(deletion.last, [writes.settlements[0].id]);
	assert.deepEqual(deletion.after, []);
	assert.equal(deletion.version, 4);
	assert.equal(deletion.rejected, true);
	assert.deepEqual(deletion.retained, writes.settlements);
	assert.deepEqual(deletion.restored, writes.settlements);
	assert.deepEqual(deletion.versions, [
		[1, 0],
		[1, 0],
		[1, 0],
	]);
}
