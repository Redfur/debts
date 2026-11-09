import assert from "node:assert/strict";
import test from "node:test";
import { isCreationDraft } from "../src/entities/debt/model/creation-drafts/validate.ts";
import {
	CURRENCY_LABEL,
	CURRENCY_SYMBOL,
	currencyGroups,
	isSupportedCurrency,
	localeCurrency,
	nextSupportedCurrency,
	prioritizedCurrencies,
	SUPPORTED_CURRENCIES,
} from "../src/shared/config/currencies.ts";
import { convertAmount } from "../src/shared/lib/exchange-rate/convert.ts";
import { fetchExchangeRates } from "../src/shared/lib/exchange-rate/fetch-rates.ts";

// Пересечение снимков API и SIX ISO 4217 (2026-11-09), без фондов и специальных единиц.
const expected =
	"AED AFN ALL AMD AOA ARS AUD AWG AZN BAM BBD BDT BHD BIF BMD BND BOB BRL BSD BTN BWP BYN BZD CAD CDF CHF CLP CNY COP CRC CUP CVE CZK DJF DKK DOP DZD EGP ERN ETB EUR FJD FKP GBP GEL GHS GIP GMD GNF GTQ GYD HKD HNL HTG HUF IDR ILS INR IQD IRR ISK JMD JOD JPY KES KGS KHR KMF KPW KRW KWD KYD KZT LAK LBP LKR LRD LSL LYD MAD MDL MGA MKD MMK MNT MOP MRU MUR MVR MWK MXN MYR MZN NAD NGN NIO NOK NPR NZD OMR PAB PEN PGK PHP PKR PLN PYG QAR RON RSD RUB RWF SAR SBD SCR SDG SEK SGD SHP SLE SOS SRD SSP STN SVC SYP SZL THB TJS TMT TND TOP TRY TTD TWD TZS UAH UGX USD UYU UZS VED VES VND VUV WST XAF XCD XCG XOF XPF YER ZAR ZMW ZWG".split(
		" ",
	);

test("catalog covers current fiat API snapshot and excludes non-fiat/historical codes", () => {
	assert.deepEqual(SUPPORTED_CURRENCIES, expected);
	for (const code of ["BTC", "ETH", "XAU", "XAG", "XDR", "MXV", "BGN", "ANG", "HRK", "BYR", "toString", "usd", null])
		assert.equal(isSupportedCurrency(code), false);
	for (const code of SUPPORTED_CURRENCIES) {
		assert.ok(CURRENCY_LABEL[code]);
		assert.ok(CURRENCY_SYMBOL[code]);
	}
	assert.deepEqual(
		[CURRENCY_SYMBOL.RUB, CURRENCY_SYMBOL.USD, CURRENCY_SYMBOL.EUR, CURRENCY_SYMBOL.CNY],
		["₽", "$", "€", "¥"],
	);
});

test("conversion handles partial legacy caches and invalid rates in either direction", () => {
	const cache = {
		base: "USD" as const,
		date: "2026-11-09",
		fetchedAt: "2026-11-09T00:00:00Z",
		rates: { USD: 1, RUB: 90, THB: 30 },
	};
	assert.equal(convertAmount(100, "THB", "RUB", cache), 300);
	assert.equal(convertAmount(300, "RUB", "THB", cache), 100);
	assert.equal(convertAmount(20, "KZT", "RUB", cache), null);
	assert.equal(convertAmount(20, "THB", "THB", null), 20);
	for (const value of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
		const invalid = { ...cache, rates: { ...cache.rates, THB: value } };
		assert.equal(convertAmount(100, "THB", "RUB", invalid), null);
		assert.equal(convertAmount(100, "RUB", "THB", invalid), null);
	}
});

test("fetch preserves all valid fiat rates, normalizes USD and uses mirror", async (t) => {
	const urls: string[] = [];
	t.mock.method(globalThis, "fetch", async (url: string) => {
		urls.push(url);
		if (urls.length === 1) throw new Error("primary unavailable");
		return new Response(
			JSON.stringify({
				date: "2026-11-09",
				usd: { usd: 2, rub: 90, thb: 30, kzt: 500, btc: 0.1, xau: 1, eur: 0, cny: -1 },
			}),
		);
	});
	const cache = await fetchExchangeRates();
	assert.equal(urls.length, 2);
	assert.ok(urls[1].includes("currency-api.pages.dev"));
	assert.deepEqual(cache.rates, { RUB: 90, THB: 30, KZT: 500, USD: 1 });
});

test("draft validation restores new fiat currencies and rejects non-fiat", () => {
	const draft = {
		kind: "debt",
		id: "draft",
		version: 1,
		updatedAt: "2026-11-09T00:00:00Z",
		payload: { currency: "THB", amount: "12.", direction: "owed_to_me", note: "" },
	};
	assert.equal(isCreationDraft(draft), true);
	assert.equal(isCreationDraft({ ...draft, payload: { ...draft.payload, currency: "BTC" } }), false);
});

test("search normalizes code/name and groups never duplicate currencies", () => {
	const top = prioritizedCurrencies(["THB", "KZT", "RUB", "THB"], "EUR", localeCurrency("ru-RU"));
	assert.deepEqual(top, ["RUB", "EUR", "USD", "KZT", "THB"]);
	assert.deepEqual(currencyGroups(top, " thb "), { top: ["THB"], other: [] });
	assert.deepEqual(currencyGroups(top, "бат"), { top: ["THB"], other: [] });
	assert.deepEqual(currencyGroups(top, "no such currency"), { top: [], other: [] });
	const groups = currencyGroups(top, "");
	assert.equal(new Set([...groups.top, ...groups.other]).size, SUPPORTED_CURRENCIES.length);
	assert.equal(groups.top.length + groups.other.length, SUPPORTED_CURRENCIES.length);
	const cycle = prioritizedCurrencies(["RUB", "THB"], "EUR", "RUB");
	assert.deepEqual(cycle, ["RUB", "EUR", "USD", "THB"]);
	assert.equal(nextSupportedCurrency("GBP", cycle), "RUB");
	assert.equal(nextSupportedCurrency("THB", cycle), "RUB");
	assert.deepEqual(prioritizedCurrencies([], "RUB", "RUB"), ["RUB", "USD"]);
});

test("used debt currencies follow repayments and deletion without keeping independent history", async () => {
	const { debtCurrencies } = await import("../src/entities/debt/model/debt-currencies.ts");
	const base = {
		contactId: "anna",
		direction: "owed_to_me" as const,
		principalAmount: 100,
		note: null,
		createdAt: "2026-11-09",
		updatedAt: "2026-11-09",
		closedAt: null,
		billId: null,
	};
	const debts = {
		a: { ...base, id: "a", currency: "THB" as const, status: "active" as const },
		b: { ...base, id: "b", currency: "KZT" as const, status: "closed" as const },
		c: { ...base, id: "c", currency: "THB" as const, status: "active" as const },
	};
	assert.deepEqual(debtCurrencies(debts, {}), { all: ["THB", "KZT"], active: ["THB"] });
	const repayment = (id: string) => [
		{ id: `repay-${id}`, debtId: id, kind: "repayment" as const, amount: 100, note: null, createdAt: "2026-11-09" },
	];
	const settled = debtCurrencies(debts, { a: repayment("a"), c: repayment("c") });
	assert.deepEqual(settled, { all: ["THB", "KZT"], active: [] });
	assert.deepEqual(prioritizedCurrencies(settled.active, "EUR", "RUB"), ["RUB", "EUR", "USD"]);
	assert.deepEqual(debtCurrencies({}, {}), { all: [], active: [] });
});
