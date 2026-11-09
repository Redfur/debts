import assert from "node:assert/strict";
import test from "node:test";
import { CLIENT_STORAGE_KEYS as keys } from "../src/shared/lib/client-storage-keys.ts";
import { createCurrencyPreferences } from "../src/shared/lib/currency-preference-state.ts";

test("legacy selection migrates once and survives switching/restart", () => {
	const data = new Map<string, string>([[keys.displayCurrency, "EUR"]]);
	const storage = {
		getItem: (key: string) => data.get(key) ?? null,
		setItem: (key: string, value: string) => {
			data.set(key, value);
		},
	};
	const state = createCurrencyPreferences(storage, "RUB");
	assert.deepEqual(state.getSnapshot(), { preferred: "EUR", current: "EUR" });
	state.setCurrent("USD");
	const restarted = createCurrencyPreferences(storage, "RUB");
	assert.deepEqual(restarted.getSnapshot(), { preferred: "EUR", current: "USD" });
	const updates: unknown[] = [];
	const unsubscribe = restarted.subscribe(() => updates.push(restarted.getSnapshot()));
	restarted.setPreferred("THB");
	assert.deepEqual(updates, [{ preferred: "THB", current: "THB" }]);
	assert.equal(data.get(keys.preferredDisplayCurrency), "THB");
	assert.equal(data.get(keys.displayCurrency), "THB");
	data.clear();
	restarted.reset("RUB");
	assert.deepEqual(restarted.getSnapshot(), { preferred: "RUB", current: "RUB" });
	assert.deepEqual(createCurrencyPreferences(storage, "RUB").getSnapshot(), { preferred: "RUB", current: "RUB" });
	unsubscribe();
});

test("new settings take precedence, invalid values fall back to locale", () => {
	const getItem = (key: string) => (key === keys.preferredDisplayCurrency ? "KZT" : "BTC");
	assert.deepEqual(createCurrencyPreferences({ getItem, setItem() {} }, "RUB").getSnapshot(), {
		preferred: "KZT",
		current: "KZT",
	});
	assert.deepEqual(createCurrencyPreferences(undefined, "RUB").getSnapshot(), { preferred: "RUB", current: "RUB" });
});

test("blocked storage preserves migration and independent settings in memory", () => {
	const store = createCurrencyPreferences(
		{
			getItem: () => "EUR",
			setItem() {
				throw Error("blocked");
			},
		},
		"RUB",
	);
	store.setCurrent("THB");
	assert.deepEqual(store.getSnapshot(), { preferred: "EUR", current: "THB" });
	store.setPreferred("KZT");
	assert.deepEqual(store.getSnapshot(), { preferred: "KZT", current: "KZT" });
	store.setCurrent("USD");
	assert.equal(store.getSnapshot().preferred, "KZT");
});
