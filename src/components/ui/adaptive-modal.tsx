import { AlertDialog as RadixAlert, Dialog as RadixDialog } from "radix-ui";
import * as React from "react";
import { Drawer } from "./drawer";

interface ModalContextValue {
	mobile: boolean;
	open: boolean;
	dismissible: boolean;
	complete: () => void;
	returnFocus: () => HTMLElement | true;
}
const ModalContext = React.createContext<ModalContextValue | null>(null);
export function useAdaptiveModal() {
	const value = React.useContext(ModalContext);
	if (!value) throw new Error("Modal parts require a modal root");
	return value;
}

export interface AdaptiveModalProps {
	children: React.ReactNode;
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	dismissible?: boolean;
	onCloseComplete?: () => void;
}

function focusAncestors() {
	const chain: HTMLElement[] = [];
	for (let element = document.activeElement; element instanceof HTMLElement; element = element.parentElement)
		chain.push(element);
	return chain;
}

export function AdaptiveModal({
	children,
	open: controlled,
	defaultOpen = false,
	onOpenChange,
	dismissible = true,
	onCloseComplete,
	alert = false,
}: AdaptiveModalProps & { alert?: boolean }) {
	const [uncontrolled, setUncontrolled] = React.useState(defaultOpen);
	const open = controlled ?? uncontrolled;
	const [session, setSession] = React.useState(() => ({
		active: open,
		mobile: window.matchMedia("(width < 1024px)").matches,
		focusChain: focusAncestors(),
	}));
	if (open && !session.active)
		setSession({ active: true, mobile: window.matchMedia("(width < 1024px)").matches, focusChain: focusAncestors() });
	const latest = React.useRef({ open, onCloseComplete });
	latest.current = { open, onCloseComplete };
	const completed = React.useRef(!open);
	if (open) completed.current = false;
	const complete = React.useCallback(() => {
		if (latest.current.open || completed.current) return;
		completed.current = true;
		setSession((previous) => ({ ...previous, active: false }));
		latest.current.onCloseComplete?.();
	}, []);
	const change = (next: boolean) => {
		if (!next && !dismissible) return;
		setUncontrolled(next);
		onOpenChange?.(next);
	};
	const returnFocus = (): HTMLElement | true => {
		// Существующий Trigger знает библиотека, в том числе при открытии без переноса фокуса.
		const origin = session.focusChain[0];
		if (origin?.isConnected && origin.getBoundingClientRect().width > 0 && !origin.matches(":disabled")) return true;
		for (const ancestor of session.focusChain) {
			if (!ancestor.isConnected) continue;
			const candidates = [ancestor, ...ancestor.querySelectorAll<HTMLElement>("button,a[href],input,[tabindex]")];
			const target = candidates.find(
				(element) =>
					element.matches("button,a[href],input,[tabindex]") &&
					!element.matches(":disabled,[tabindex='-1']") &&
					element.getBoundingClientRect().width > 0 &&
					!element.closest("[data-modal-backend][data-closed]"),
			);
			if (target) return target;
		}
		return true;
	};
	const value = { mobile: session.mobile, open, dismissible, complete, returnFocus };
	return (
		<ModalContext.Provider value={value}>
			{session.mobile ? (
				<Drawer.Root
					open={open}
					onOpenChange={(next, details) => {
						// Radix Select/Popover обрабатывают Escape в capture-фазе.
						if (!next && (!dismissible || (details.reason === "escape-key" && details.event.defaultPrevented)))
							details.cancel();
						else change(next);
					}}
					disablePointerDismissal={alert || !dismissible}
					onOpenChangeComplete={(next) => {
						if (!next) complete();
					}}
				>
					{children}
				</Drawer.Root>
			) : alert ? (
				<RadixAlert.Root open={open} onOpenChange={change}>
					{children}
				</RadixAlert.Root>
			) : (
				<RadixDialog.Root open={open} onOpenChange={change}>
					{children}
				</RadixDialog.Root>
			)}
		</ModalContext.Provider>
	);
}

/** Radix Presence завершает CSS-анимацию; Web Animations учитывает и отсутствие движения. */
export function useRadixCloseComplete() {
	const { open, complete, mobile } = useAdaptiveModal();
	const ref = React.useRef<HTMLDivElement>(null);
	React.useEffect(() => {
		if (open || mobile) return;
		let canceled = false;
		const frame = requestAnimationFrame(() => {
			const animations = ref.current?.getAnimations() ?? [];
			void Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
				if (!canceled) complete();
			});
		});
		return () => {
			canceled = true;
			cancelAnimationFrame(frame);
		};
	}, [open, complete, mobile]);
	return ref;
}
