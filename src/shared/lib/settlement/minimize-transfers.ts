export type SettlementBalance = {
	id: string;
	/** Целые копейки: > 0 — должен получить, < 0 — должен перевести. */
	cents: number;
};

export type SettlementTransfer = {
	from: string;
	to: string;
	cents: number;
};

/** До этого числа ненулевых балансов схема точно минимальна (DP по маскам, 3^n), дальше — жадная. */
const EXACT_LIMIT = 12;

type Entry = { id: string; cents: number; order: number };

/** Крупнейший должник платит крупнейшему кредитору; при равенстве — меньший индекс. Даёт не больше |группа| − 1 переводов. */
function settleGreedy(entries: Entry[]): SettlementTransfer[] {
	const left = entries.map((e) => ({ ...e }));
	const transfers: SettlementTransfer[] = [];
	const pickLargest = (sign: 1 | -1) => {
		let best: (typeof left)[number] | undefined;
		for (const e of left) {
			if (sign * e.cents <= 0) continue;
			if (!best || sign * e.cents > sign * best.cents) best = e;
		}
		return best;
	};
	for (;;) {
		const debtor = pickLargest(-1);
		const creditor = pickLargest(1);
		if (!debtor || !creditor) break;
		const cents = Math.min(-debtor.cents, creditor.cents);
		transfers.push({ from: debtor.id, to: creditor.id, cents });
		debtor.cents += cents;
		creditor.cents -= cents;
	}
	return transfers;
}

/** Разбиение на максимальное число групп с нулевой суммой: каждая группа закрывается |группа| − 1 переводами. */
function splitIntoZeroGroups(entries: Entry[]): Entry[][] {
	const n = entries.length;
	const full = (1 << n) - 1;
	const sum = new Array<number>(full + 1).fill(0);
	for (let mask = 1; mask <= full; mask++) {
		const low = mask & -mask;
		sum[mask] = sum[mask ^ low] + entries[31 - Math.clz32(low)].cents;
	}
	// best[mask] — максимум групп для маски с нулевой суммой, pick[mask] — первая группа (содержит младший элемент).
	const best = new Array<number>(full + 1).fill(-1);
	const pick = new Array<number>(full + 1).fill(0);
	best[0] = 0;
	for (let mask = 1; mask <= full; mask++) {
		if (sum[mask] !== 0) continue;
		const low = mask & -mask;
		const rest = mask ^ low;
		// Перебор подмасок rest по возрастанию: при равном числе групп побеждает группа из меньших индексов.
		let sub = 0;
		for (;;) {
			const group = sub | low;
			const remainder = mask ^ group;
			if (sum[group] === 0 && best[remainder] >= 0 && best[remainder] + 1 > best[mask]) {
				best[mask] = best[remainder] + 1;
				pick[mask] = group;
			}
			if (sub === rest) break;
			sub = (sub - rest) & rest;
		}
	}
	const groups: Entry[][] = [];
	let mask = full;
	while (mask) {
		const group = pick[mask];
		groups.push(entries.filter((_, i) => group & (1 << i)));
		mask ^= group;
	}
	return groups;
}

/**
 * Минимальная по числу переводов схема, обнуляющая балансы (сумма балансов должна быть 0).
 * Детерминирована: одинаковый вход даёт одинаковый список; группы — по первому индексу во входе.
 */
export function minimizeTransfers(balances: SettlementBalance[]): SettlementTransfer[] {
	const entries = balances.map((b, order) => ({ ...b, order })).filter((e) => e.cents !== 0);
	if (entries.length === 0) return [];
	if (entries.reduce((acc, e) => acc + e.cents, 0) !== 0) {
		throw new Error("minimizeTransfers: сумма балансов не равна нулю");
	}
	if (entries.length > EXACT_LIMIT) return settleGreedy(entries);
	return splitIntoZeroGroups(entries)
		.sort((a, b) => a[0].order - b[0].order)
		.flatMap(settleGreedy);
}
