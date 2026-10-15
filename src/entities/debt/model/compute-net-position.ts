import { roundAmount } from "@/shared/lib/round-amount";
import type { NetPosition } from "./types";

/**
 * Чистая позиция: кто кому должен больше и на сколько (в валюте итогов).
 * `none` — нечего показывать: обе стороны нулевые или сумму нельзя посчитать без курса.
 */
export function computeNetPosition(owedToMe: number | null, owedByMe: number | null): NetPosition {
	if (owedToMe === null || owedByMe === null) return { kind: "none", diff: 0 };
	if (owedToMe === 0 && owedByMe === 0) return { kind: "none", diff: 0 };
	const diff = roundAmount(owedToMe - owedByMe);
	if (diff > 0) return { kind: "owed-to-me", diff };
	if (diff < 0) return { kind: "i-owe", diff: -diff };
	return { kind: "balanced", diff: 0 };
}
