import { format, isValid, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

/** Короткие месяцы как в макетах: без точки, «мая» в родительном падеже (date-fns `ru` даёт «сент.»). */
const SHORT_MONTHS = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"] as const;

type DateInput = Date | string;

/** ISO-строка или `YYYY-MM-DD` (дата курса) → Date; дата без времени трактуется как локальная, а не UTC. */
function toDate(value: DateInput): Date {
	return typeof value === "string" ? parseISO(value) : value;
}

/** «12 сен» в текущем году, «12 сен 2025» — в другом. */
export function formatShortDate(value: DateInput, now: Date = new Date()): string {
	const d = toDate(value);
	if (!isValid(d)) return "";
	const base = `${d.getDate()} ${SHORT_MONTHS[d.getMonth()]}`;
	return d.getFullYear() === now.getFullYear() ? base : `${base} ${d.getFullYear()}`;
}

/** «15 октября». */
export function formatLongDate(value: DateInput): string {
	const d = toDate(value);
	return isValid(d) ? format(d, "d MMMM", { locale: ru }) : "";
}

/** «15 октября в 12:40» — момент события по местному времени. */
export function formatMoment(value: DateInput): string {
	const d = toDate(value);
	return isValid(d) ? format(d, "d MMMM 'в' HH:mm", { locale: ru }) : "";
}

/** «12 октября 2026, 18:05». */
export function formatDateTimeWithYear(value: DateInput): string {
	const d = toDate(value);
	return isValid(d) ? format(d, "d MMMM yyyy, HH:mm", { locale: ru }) : "";
}
