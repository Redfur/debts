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
			<div className="flex flex-1 flex-col items-center justify-center gap-4 py-12 text-center">
				<p className="text-foreground max-w-sm text-base font-medium">{i18n.t("routeErrorTitle", { ns: COMMON_NS })}</p>
				<p className="text-muted-foreground max-w-sm text-sm">{i18n.t("routeErrorHint", { ns: COMMON_NS })}</p>
				<Button type="button" onClick={() => window.location.reload()}>
					{i18n.t("reloadPage", { ns: COMMON_NS })}
				</Button>
			</div>
		);
	}
}
