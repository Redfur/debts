import { useDebtStore } from "./debt-store";
import type { DebtOperation } from "./types";

/** Стабильная ссылка: `?? []` в Zustand-селекторе создавал бы новый массив на каждый вызов
 * и после удаления долга приводил к бесконечному циклу ре-рендеров (useSyncExternalStore). */
const EMPTY_OPERATIONS: DebtOperation[] = [];

/** Операции долга по id; безопасно для использования в компонентах, переживающих удаление долга. */
export function useDebtOperations(debtId: string): DebtOperation[] {
	return useDebtStore((s) => s.operationsByDebtId[debtId] ?? EMPTY_OPERATIONS);
}
