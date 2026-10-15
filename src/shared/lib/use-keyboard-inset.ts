import { useEffect, useState } from "react";

/**
 * Высота экранной клавиатуры в px по `visualViewport` (iOS Safari не сжимает layout-viewport).
 * В браузерах с `interactive-widget=resizes-content` (Chrome/Android) layout уже сжат — вернётся 0.
 */
export function useKeyboardInset(): number {
	const [inset, setInset] = useState(0);

	useEffect(() => {
		const vv = window.visualViewport;
		if (!vv) return;
		const update = () => {
			const hidden = window.innerHeight - vv.height - vv.offsetTop;
			setInset(hidden > 80 ? Math.round(hidden) : 0);
		};
		update();
		vv.addEventListener("resize", update);
		vv.addEventListener("scroll", update);
		return () => {
			vv.removeEventListener("resize", update);
			vv.removeEventListener("scroll", update);
		};
	}, []);

	return inset;
}
