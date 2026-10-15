import { type BillTransfer, ME_REF } from "@/entities/debt";

/** Чем для участника кончается счёт: части подписи под именем, по порядку. */
export type ParticipantOutcome =
	| { kind: "toMe" }
	| { kind: "fromMe" }
	| { kind: "with"; refs: string[] }
	| { kind: "settled" }
	| { kind: "myShare" };

export function describeParticipant(ref: string, transfers: BillTransfer[]): ParticipantOutcome[] {
	const own = transfers.filter((t) => t.from === ref || t.to === ref);
	if (ref === ME_REF) {
		return own.some((t) => t.from === ME_REF) ? [{ kind: "fromMe" }] : [{ kind: "myShare" }];
	}
	const parts: ParticipantOutcome[] = [];
	if (own.some((t) => t.from === ref && t.to === ME_REF)) parts.push({ kind: "toMe" });
	if (own.some((t) => t.from === ME_REF && t.to === ref)) parts.push({ kind: "fromMe" });
	const others = own.filter((t) => t.from !== ME_REF && t.to !== ME_REF).map((t) => (t.from === ref ? t.to : t.from));
	if (others.length > 0) parts.push({ kind: "with", refs: others });
	return parts.length > 0 ? parts : [{ kind: "settled" }];
}

export type BillConsequences = {
	owedToMe: { ref: string; amount: number }[];
	iOwe: { ref: string; amount: number }[];
	/** Есть переводы между другими участниками. */
	hasOthers: boolean;
};

export function describeConsequences(transfers: BillTransfer[]): BillConsequences {
	return {
		owedToMe: transfers.filter((t) => t.to === ME_REF).map((t) => ({ ref: t.from, amount: t.amount })),
		iOwe: transfers.filter((t) => t.from === ME_REF).map((t) => ({ ref: t.to, amount: t.amount })),
		hasOthers: transfers.some((t) => t.from !== ME_REF && t.to !== ME_REF),
	};
}
