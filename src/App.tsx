import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "@/app/AppRoutes";
import { AppShell } from "@/app/layout/app-shell";
import { RouteErrorBoundary } from "@/app/providers/route-error-boundary";

function App() {
	return (
		<BrowserRouter basename={import.meta.env.BASE_URL}>
			<AppShell>
				<RouteErrorBoundary>
					<AppRoutes />
				</RouteErrorBoundary>
			</AppShell>
		</BrowserRouter>
	);
}

export default App;
