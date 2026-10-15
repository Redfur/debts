/** Собирательные числительные в винительном падеже: «на двоих» … «на десятерых». */
const COLLECTIVE = [
	"",
	"",
	"двоих",
	"троих",
	"четверых",
	"пятерых",
	"шестерых",
	"семерых",
	"восьмерых",
	"девятерых",
	"десятерых",
];

/** Число людей после «на»: «четверых», «12 человек», «22 человека». От имён не зависит. */
export function formatPeopleCount(count: number): string {
	if (count >= 2 && count <= 10) return COLLECTIVE[count];
	const mod10 = count % 10;
	const mod100 = count % 100;
	const few = mod10 >= 1 && mod10 <= 4 && (mod100 < 11 || mod100 > 14);
	return `${count} ${few ? "человека" : "человек"}`;
}
