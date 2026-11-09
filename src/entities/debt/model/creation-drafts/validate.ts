import { isSupportedCurrency } from "../../../../shared/config/currencies.ts";
import type { CreationDraft } from "../../../../shared/lib/storage/schema";

function object(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
function strings(value: unknown): value is string[] {
	return Array.isArray(value) && value.every((v) => typeof v === "string") && new Set(value).size === value.length;
}
function number(value: unknown): value is number {
	return typeof value === "number" && Number.isFinite(value);
}
function people(value: unknown) {
	return number(value) && Number.isInteger(value) && value >= 0 && value <= 99;
}
function adjustment(value: unknown) {
	return (
		object(value) &&
		typeof value.open === "boolean" &&
		(value.unit === "percent" || value.unit === "amount") &&
		typeof value.value === "string"
	);
}

/** Проверяет формат снимка, не валидность незавершённых денежных полей. */
export function isCreationDraft(value: unknown): value is CreationDraft {
	if (
		!object(value) ||
		value.version !== 1 ||
		typeof value.id !== "string" ||
		!value.id ||
		typeof value.updatedAt !== "string" ||
		!Number.isFinite(Date.parse(value.updatedAt)) ||
		!object(value.payload)
	)
		return false;
	const p = value.payload;
	if (!isSupportedCurrency(p.currency) || typeof p.amount !== "string") return false;
	if (value.kind === "debt")
		return (
			(p.contactId === undefined || typeof p.contactId === "string") &&
			(p.direction === "owed_to_me" || p.direction === "i_owe") &&
			typeof p.note === "string"
		);
	if (value.kind !== "bill") return false;
	if (
		(p.entry !== "sum" && p.entry !== "receipt") ||
		(p.step !== 1 && p.step !== 2) ||
		typeof p.title !== "string" ||
		(p.payerMode !== "one" && p.payerMode !== "several") ||
		typeof p.payerRef !== "string" ||
		!["equal", "shares", "amounts"].includes(String(p.splitMode))
	)
		return false;
	if (
		!Array.isArray(p.participants) ||
		!p.participants.every(
			(v: unknown) =>
				object(v) &&
				typeof v.ref === "string" &&
				typeof v.paid === "string" &&
				typeof v.inSplit === "boolean" &&
				number(v.shares) &&
				typeof v.amount === "string",
		)
	)
		return false;
	const refs: unknown[] = p.participants.map((v: Record<string, unknown>) => v.ref);
	if (!strings(refs) || !refs.includes("me") || !refs.includes(p.payerRef)) return false;
	const validRefs = (v: unknown) => strings(v) && v.every((r) => refs.includes(r));
	if (
		!Array.isArray(p.items) ||
		!p.items.every(
			(v: unknown) =>
				object(v) &&
				typeof v.id === "string" &&
				typeof v.title === "string" &&
				typeof v.price === "string" &&
				validRefs(v.refs) &&
				people(v.extraPeople),
		)
	)
		return false;
	if (new Set(p.items.map((v: Record<string, unknown>) => v.id)).size !== p.items.length) return false;
	return (
		adjustment(p.discount) &&
		adjustment(p.tips) &&
		object(p.tips) &&
		validRefs(p.tips.refs) &&
		people(p.tips.extraPeople)
	);
}

export function draftRecordId(value: unknown): string | undefined {
	return object(value) && typeof value.id === "string" ? value.id : undefined;
}
