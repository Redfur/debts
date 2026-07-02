import { roundAmount } from "@/shared/lib/round-amount";
import type { Debt, DebtOperation } from "./types";

/** Остаток долга: исходная сумма минус сумма погашений; не уходит ниже нуля. */
export function computeDebtBalance(debt: Debt, operations: DebtOperation[]): number {
	const repaid = operations.filter((op) => op.kind === "repayment").reduce((sum, op) => sum + op.amount, 0);
	return Math.max(0, roundAmount(debt.principalAmount - repaid));
}
