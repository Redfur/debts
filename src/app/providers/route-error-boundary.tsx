import { X } from "lucide-react";
import type { ErrorInfo, ReactNode } from "react";
import { Component } from "react";
import { Button } from "@/components/ui/button";
import { COMMON_NS } from "@/shared/i18n";
import { i18n } from "@/shared/lib/i18n";
import { isChunkLoadError } from "@/shared/lib/is-chunk-load-error";

const CHUNK_RELOAD_KEY = "app_chunk_reload_attempted";

type Props = {
	children: ReactNode;
};

type State = {
	hasError: boolean;
	error: Error | null;
};

export class RouteErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
		if (isChunkLoadError(error)) {
			if (typeof sessionStorage !== "undefined" && !sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
				sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
				window.location.reload();
				return;
			}
		}
		console.error(error, errorInfo);
	}

	render(): ReactNode {
		if (!this.state.hasError || !this.state.error) {
			return this.props.children;
		}

		const err = this.state.error;
		const pendingChunkReload =
			isChunkLoadError(err) && typeof sessionStorage !== "undefined" && !sessionStorage.getItem(CHUNK_RELOAD_KEY);

		if (pendingChunkReload) {
			return null;
		}

		return (
			<div className="flex min-h-[calc(100svh-140px)] flex-1 flex-col px-2 pt-[calc(env(safe-area-inset-top,0px)+20px)] lg:min-h-[70svh]">
				<div role="alert" className="flex flex-1 flex-col items-center justify-center gap-[18px] text-center">
					<div aria-hidden="true" className="relative h-24 w-[120px]">
						<div className="bg-card absolute top-2 left-2.5 flex h-20 w-[100px] flex-col gap-2 rounded-card px-4 py-[18px] shadow-[0_8px_24px_rgba(23,26,33,0.08)]">
							<span className="bg-muted h-2 w-[50px] rounded-full" />
							<span className="bg-muted h-2 w-[68px] rounded-full" />
							<span className="bg-muted h-2 w-9 rounded-full" />
						</div>
						<span className="bg-destructive-muted text-destructive ring-background absolute right-0 bottom-0 flex size-9 items-center justify-center rounded-full ring-4">
							<X className="size-5" strokeWidth={2.6} />
						</span>
					</div>
					<div className="flex max-w-sm flex-col gap-2">
						<h1 className="text-[22px] leading-7 font-bold">{i18n.t("routeErrorTitle", { ns: COMMON_NS })}</h1>
						<p className="text-muted-foreground text-[15px] leading-[22px]">
							{i18n.t("routeErrorHint", { ns: COMMON_NS })}
						</p>
					</div>
				</div>
				<div className="mx-auto flex w-full max-w-sm flex-col gap-1 pb-4">
					<Button type="button" size="lg" onClick={() => window.location.reload()}>
						{i18n.t("reloadPage", { ns: COMMON_NS })}
					</Button>
					<Button
						type="button"
						variant="link"
						className="h-11"
						onClick={() => window.location.assign(import.meta.env.BASE_URL)}
					>
						{i18n.t("toHome", { ns: COMMON_NS })}
					</Button>
				</div>
			</div>
		);
	}
}
