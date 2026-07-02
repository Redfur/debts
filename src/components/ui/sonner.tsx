import type { ComponentProps } from "react";
import { useEffect, useState } from "react";
import { Toaster as Sonner } from "sonner";

type ToasterProps = ComponentProps<typeof Sonner>;

function useHtmlDarkClass(): boolean {
	const [dark, setDark] = useState(
		() => typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
	);
	useEffect(() => {
		const el = document.documentElement;
		const obs = new MutationObserver(() => {
			setDark(el.classList.contains("dark"));
		});
		obs.observe(el, { attributes: true, attributeFilter: ["class"] });
		return () => obs.disconnect();
	}, []);
	return dark;
}

export function Toaster({ ...props }: ToasterProps) {
	const dark = useHtmlDarkClass();
	return <Sonner className="toaster group" theme={dark ? "dark" : "light"} position="top-center" {...props} />;
}
