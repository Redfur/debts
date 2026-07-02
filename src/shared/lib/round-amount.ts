/** Округление денежной суммы до копеек/центов, чтобы избежать погрешности плавающей точки. */
export function roundAmount(value: number): number {
	return Math.round(value * 100) / 100;
}
