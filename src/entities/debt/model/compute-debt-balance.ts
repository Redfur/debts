import { roundAmount } from "../../../shared/lib/round-amount.ts";
import type { Debt, DebtOperation } from "./types";

/** После погашения или закрытия расчётом финансовые поля долга зафиксированы. */
export function hasDebtReductions(operations: readonly DebtOperation[]): boolean {
	return operations.some((op) => op.kind !== "initial");
}

/** Остаток долга: исходная сумма минус погашения и закрытие расчётом. */
export function computeDebtBalance(debt: Debt, operations: readonly DebtOperation[]): number {
	const repaid = operations.reduce((sum, op) => (op.kind === "initial" ? sum : sum + op.amount), 0);
	return Math.max(0, roundAmount(debt.principalAmount - repaid));
}
