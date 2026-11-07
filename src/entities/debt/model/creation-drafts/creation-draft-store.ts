import { create } from "zustand";
import { generateId } from "@/shared/lib/id";
import {
	type CreationDraft,
	type CreationDraftKind,
	type CreationDraftPayloads,
	getStorageAdapter,
} from "@/shared/lib/storage";
import { draftRecordId, isCreationDraft } from "./validate";

type Slot = {
	ready: boolean;
	readError: boolean;
	recordId?: string;
	present: boolean;
	draft: CreationDraft | null;
	status: "idle" | "saving" | "saved" | "error";
	locked: boolean;
};
const empty = (): Slot => ({
	ready: false,
	readError: false,
	recordId: undefined,
	present: false,
	draft: null,
	status: "idle",
	locked: false,
});
export const useCreationDraftStore = create<{ debt: Slot; bill: Slot }>(() => ({ debt: empty(), bill: empty() }));
const queues: Record<CreationDraftKind, Promise<void>> = { debt: Promise.resolve(), bill: Promise.resolve() };
const reads: Partial<Record<CreationDraftKind, Promise<void>>> = {};
const slot = (kind: CreationDraftKind) => useCreationDraftStore.getState()[kind];
function patch(kind: CreationDraftKind, changes: Partial<Slot>) {
	useCreationDraftStore.setState((s) => ({ [kind]: { ...s[kind], ...changes } }));
}

export function hydrateCreationDraft(kind: CreationDraftKind): Promise<void> {
	if (reads[kind]) return reads[kind];
	if (slot(kind).ready && !slot(kind).readError) return Promise.resolve();
	const read = async () => {
		patch(kind, { ready: false });
		try {
			const raw = await getStorageAdapter().getCreationDraft(kind);
			const valid = isCreationDraft(raw) && raw.kind === kind;
			patch(kind, {
				ready: true,
				present: raw !== undefined,
				recordId: draftRecordId(raw),
				draft: valid ? raw : null,
				readError: raw !== undefined && !valid,
				status: valid ? "saved" : "idle",
			});
		} catch {
			patch(kind, { ready: true, readError: true });
		} finally {
			delete reads[kind];
		}
	};
	reads[kind] = read();
	return reads[kind];
}

function enqueue(draft: CreationDraft) {
	const { kind } = draft;
	patch(kind, { status: "saving" });
	queues[kind] = queues[kind].then(async () => {
		try {
			await getStorageAdapter().putCreationDraft(draft);
			if (slot(kind).draft === draft) patch(kind, { status: "saved" });
		} catch {
			if (slot(kind).draft === draft) patch(kind, { status: "error" });
		}
	});
}

export function saveCreationDraft<K extends CreationDraftKind>(kind: K, payload: CreationDraftPayloads[K]) {
	const current = slot(kind);
	if (!current.ready || current.readError || current.locked) return;
	// K и payload связаны публичным generic-контрактом, TS не сохраняет эту связь внутри mapped union.
	const draft = {
		kind,
		payload,
		id: current.draft?.id ?? generateId(),
		version: 1,
		updatedAt: new Date().toISOString(),
	} as CreationDraft;
	patch(kind, { draft, present: true, recordId: draft.id });
	enqueue(draft);
}

export function retryCreationDraft(kind: CreationDraftKind) {
	const current = slot(kind);
	if (current.draft && !current.locked) enqueue(current.draft);
}
export async function flushCreationDraft(kind: CreationDraftKind) {
	let pending: Promise<void>;
	do {
		pending = queues[kind];
		await pending;
	} while (pending !== queues[kind]);
	return slot(kind).status !== "error";
}

/** Останавливает новые снимки до commit окончательной записи либо удаления. */
export async function completeCreationDraft<T>(
	kind: CreationDraftKind,
	write: (id: string | undefined) => Promise<T | undefined>,
): Promise<T | undefined> {
	if (slot(kind).locked || slot(kind).readError) return undefined;
	patch(kind, { locked: true });
	await queues[kind];
	try {
		const result = await write(slot(kind).draft?.id);
		if (result !== undefined) patch(kind, { ...empty(), ready: true });
		return result;
	} finally {
		patch(kind, { locked: false });
	}
}

export async function deleteCreationDraft(kind: CreationDraftKind): Promise<boolean> {
	if (slot(kind).locked || !slot(kind).ready) return false;
	patch(kind, { locked: true });
	await queues[kind];
	try {
		await getStorageAdapter().deleteCreationDraft(kind, slot(kind).recordId);
		patch(kind, { ...empty(), ready: true });
		return true;
	} catch {
		return false;
	} finally {
		patch(kind, { locked: false });
	}
}

/** Импорт и сброс ждут все записи; старые снимки не могут воскреснуть после очистки. */
export async function clearCreationDraftsWith(write: () => Promise<void>): Promise<void> {
	if (slot("debt").locked || slot("bill").locked) throw new Error("Creation draft operation in progress");
	patch("debt", { locked: true });
	patch("bill", { locked: true });
	await Promise.all([queues.debt, queues.bill, reads.debt, reads.bill]);
	try {
		await write();
		patch("debt", { ...empty(), ready: true });
		patch("bill", { ...empty(), ready: true });
	} finally {
		patch("debt", { locked: false });
		patch("bill", { locked: false });
	}
}
