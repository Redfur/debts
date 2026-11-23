import { isSupportedCurrency } from "@/shared/config/currencies";
import { type CurrencyCode, getStorageAdapter, type PersistedBill, type PersistedDebt } from "@/shared/lib/storage";

export async function readInitialCreationCurrency(): Promise<CurrencyCode> {
	const basis = await getStorageAdapter().readCreationCurrencyBasis();
	if ("remembered" in basis) return basis.remembered;

	const fromSettlements = new Set(
		basis.debtOperations.filter((op) => op.kind === "initial" && op.settlementId).map((op) => op.debtId),
	);
	let currency: CurrencyCode = "RUB";
	let latest = -Infinity;
	let latestKey = "";
	const consider = (record: PersistedDebt | PersistedBill, kind: "bill" | "debt") => {
		if (!isSupportedCurrency(record.currency)) return;
		const time = Date.parse(record.createdAt);
		const key = `${kind}:${record.id}`;
		if (time > latest || (time === latest && key > latestKey)) {
			currency = record.currency;
			latest = time;
			latestKey = key;
		}
	};
	for (const debt of basis.debts) {
		if (!debt.billId && !fromSettlements.has(debt.id)) consider(debt, "debt");
	}
	for (const bill of basis.bills) consider(bill, "bill");
	return currency;
}
