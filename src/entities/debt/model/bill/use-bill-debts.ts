import { useShallow } from "zustand/react/shallow";
import { useDebtStore } from "../debt-store";
import type { Debt } from "../types";

/** Долги пользователя из счёта (пусто — счёт без моих переводов). */
export function useBillDebts(billId: string): Debt[] {
	return useDebtStore(useShallow((s) => Object.values(s.debtsById).filter((d) => d.billId === billId)));
}
