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
	// Тосты — над нижним меню на мобильном и внизу экрана на десктопе; тёмная «пилюля» по макету, 4 с.
	const bottom = "calc(env(safe-area-inset-bottom, 0px) + 100px)";
	return (
		<Sonner
			className="toaster group"
			theme={dark ? "dark" : "light"}
			position="bottom-center"
			duration={4000}
			offset={{ bottom }}
			mobileOffset={{ bottom, left: 16, right: 16 }}
			toastOptions={{
				classNames: {
					toast:
						"!rounded-[16px] !border-0 !bg-foreground !text-background !shadow-raised !font-sans !text-sm !font-medium !min-h-12",
					description: "!text-background/70",
					actionButton: "!rounded-full !bg-accent !text-accent-foreground !font-semibold !px-3.5 !h-9",
					cancelButton: "!rounded-full !bg-background/15 !text-background !px-3.5 !h-9",
					success: "[&_[data-icon]]:!text-owed-to-me",
					error: "[&_[data-icon]]:!text-i-owe",
				},
			}}
			{...props}
		/>
	);
}
