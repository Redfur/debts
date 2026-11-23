import assert from "node:assert/strict";
import { test } from "node:test";
import {
	computeSettlementBasis,
	computeSettlementRemainder,
} from "../src/entities/debt/model/compute-contact-settlement.ts";
import { computeDebtBalance, hasDebtReductions } from "../src/entities/debt/model/compute-debt-balance.ts";
import type { Debt, DebtOperation } from "../src/entities/debt/model/types.ts";

function debt(id: string, direction: Debt["direction"], principalAmount: number, patch?: Partial<Debt>): Debt {
	return {
		id,
		contactId: "anna",
		direction,
		principalAmount,
		currency: "RUB",
		status: "active",
		billId: null,
		note: null,
		createdAt: "",
		updatedAt: "",
		closedAt: null,
		...patch,
	};
}

test("расчёт берёт открытые остатки одного контакта и исходной валюты, включая долг из счёта", () => {
	const payment: DebtOperation = {
		id: "payment",
		debtId: "bill-debt",
		kind: "repayment",
		amount: 300,
		note: null,
		createdAt: "",
	};
	const basis = computeSettlementBasis(
		"anna",
		"RUB",
		[
			debt("bill-debt", "i_owe", 1000, { billId: "bill" }),
			debt("personal", "owed_to_me", 215),
			debt("usd", "i_owe", 100, { currency: "USD" }),
			debt("other", "i_owe", 100, { contactId: "ivan" }),
			debt("closed", "i_owe", 100, { status: "closed" }),
		],
		{ "bill-debt": [payment] },
	);
	assert.deepEqual(
		basis.debts.map(({ debt, balanceCents }) => [debt.id, balanceCents]),
		[
			["bill-debt", 70_000],
			["personal", 21_500],
		],
	);
	assert.equal(basis.netCents, -48_500);
	assert.equal(computeSettlementRemainder(basis, { direction: "sent", cents: 48_500 }), null);
	assert.deepEqual(computeSettlementRemainder(basis, { direction: "sent", cents: 50_000 }), {
		direction: "owed_to_me",
		cents: 1500,
	});
	assert.deepEqual(computeSettlementRemainder(basis, { direction: "sent", cents: 45_000 }), {
		direction: "i_owe",
		cents: 3500,
	});
	assert.deepEqual(computeSettlementRemainder(basis, { direction: "received", cents: 10_000 }), {
		direction: "i_owe",
		cents: 58_500,
	});
	assert.deepEqual(computeSettlementRemainder(basis, { direction: "sent", cents: 0 }), {
		direction: "i_owe",
		cents: 48_500,
	});
});

test("копейки не оставляют ложного остатка при зачёте или точной передаче", () => {
	const basis = computeSettlementBasis(
		"anna",
		"RUB",
		[debt("1", "owed_to_me", 0.1), debt("2", "owed_to_me", 0.2), debt("3", "i_owe", 0.3)],
		{},
	);
	assert.equal(computeSettlementRemainder(basis, null), null);
	assert.deepEqual(computeSettlementRemainder(basis, { direction: "received", cents: 1 }), {
		direction: "i_owe",
		cents: 1,
	});
	const oneWay = computeSettlementBasis("anna", "RUB", [debt("1", "owed_to_me", 0.3)], {});
	assert.equal(computeSettlementRemainder(oneWay, { direction: "received", cents: 30 }), null);
	assert.equal(computeSettlementRemainder(oneWay, null), undefined);
	assert.equal(computeSettlementRemainder(oneWay, { direction: "received", cents: 0 }), undefined);
	assert.equal(computeSettlementRemainder(oneWay, { direction: "received", cents: -1 }), undefined);
});

test("закрытие расчётом учитывается наряду с обычным погашением, но происхождение остатка не блокирует правку", () => {
	const original = debt("original", "i_owe", 1000);
	const paid: DebtOperation = {
		id: "paid",
		debtId: original.id,
		kind: "repayment",
		amount: 300,
		note: "Перевод",
		createdAt: "",
	};
	const closed: DebtOperation = {
		...paid,
		id: "closed",
		kind: "settlement_close",
		amount: 700,
		note: null,
		settlementId: "settlement",
	};
	assert.equal(computeDebtBalance(original, [paid]), 700);
	assert.equal(computeDebtBalance(original, [paid, closed]), 0);
	assert.equal(paid.note, "Перевод");
	assert.equal(hasDebtReductions([closed]), true);
	assert.equal(hasDebtReductions([{ ...closed, kind: "initial" }]), false);
});
