import { Drawer } from "@base-ui/react/drawer";
import * as React from "react";
import { cn } from "@/shared/lib/utils";

export { Drawer };

/** Исключаем весь жест, начатый в прокрученном списке или интерактивном элементе.
 * Base UI продолжает владеть физикой, нативной прокруткой и отменой движения. */
function useSwipeIgnore() {
	const ignored = React.useRef<{ element: HTMLElement; previous: string | null } | null>(null);
	const restore = React.useCallback(() => {
		const entry = ignored.current;
		if (!entry) return;
		if (entry.previous === null) entry.element.removeAttribute("data-base-ui-swipe-ignore");
		else entry.element.setAttribute("data-base-ui-swipe-ignore", entry.previous);
		ignored.current = null;
	}, []);
	React.useEffect(() => restore, [restore]);
	return (event: React.SyntheticEvent<HTMLDivElement>) => {
		restore();
		const original = event.target;
		if (!(original instanceof Element)) return;
		const target = original instanceof HTMLElement ? original : original.closest("button,a,label,[role=button]");
		if (!(target instanceof HTMLElement) || target.closest('[data-slot="drawer-popup"]') !== event.currentTarget)
			return;
		let ignore = Boolean(
			target.closest("input,textarea,button,a,label,[role=button],[role=radio],[contenteditable=true]"),
		);
		ignore ||= Boolean(window.getSelection()?.toString());
		for (let el: HTMLElement | null = target; el && el !== event.currentTarget; el = el.parentElement) {
			if (el.scrollTop > 0 && /auto|scroll/.test(getComputedStyle(el).overflowY)) ignore = true;
		}
		if (ignore) {
			ignored.current = { element: target, previous: target.getAttribute("data-base-ui-swipe-ignore") };
			target.setAttribute("data-base-ui-swipe-ignore", "");
		}
	};
}

/** Нижний Drawer по композиции shadcn Base UI, без snap points и масштабирования страницы. */
export function DrawerContent({
	className,
	children,
	dismissible = true,
	...props
}: Drawer.Popup.Props & { dismissible?: boolean }) {
	const ignoreSwipe = useSwipeIgnore();
	return (
		<Drawer.Portal>
			<Drawer.Backdrop className="drawer-overlay fixed inset-0 z-50 min-h-dvh bg-scrim supports-[-webkit-touch-callout:none]:absolute" />
			<Drawer.VirtualKeyboardProvider>
				<Drawer.Viewport data-slot="drawer-viewport" className="fixed inset-0 z-50">
					<Drawer.Popup
						data-slot="drawer-popup"
						data-base-ui-swipe-ignore={dismissible ? undefined : ""}
						onPointerDownCapture={ignoreSwipe}
						onTouchStartCapture={ignoreSwipe}
						className={cn(
							"drawer-popup bg-card text-card-foreground fixed inset-x-0 bottom-0 flex max-h-[92dvh] min-h-0 flex-col gap-4 overflow-hidden rounded-t-sheet px-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] outline-none",
							className,
						)}
						{...props}
					>
						<div
							aria-hidden="true"
							data-slot="drawer-handle"
							className="-mx-4 -mb-4 flex h-11 shrink-0 cursor-grab self-stretch items-center justify-center active:cursor-grabbing"
						>
							<span className="h-[5px] w-9 rounded-full bg-muted-foreground/30" />
						</div>
						{children}
					</Drawer.Popup>
				</Drawer.Viewport>
			</Drawer.VirtualKeyboardProvider>
		</Drawer.Portal>
	);
}
