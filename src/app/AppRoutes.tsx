import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { HomePage } from "@/pages/home";

import "@/widgets/home-screen";
import "@/widgets/contact-detail";
import { SettingsRouteFallback } from "./route-fallbacks";

const SettingsPage = lazy(async () => {
	const m = await import("@/pages/settings");
	return { default: m.SettingsPage };
});

const ContactDetailPage = lazy(async () => {
	const m = await import("@/pages/contact-detail");
	return { default: m.ContactDetailPage };
});

export function AppRoutes() {
	return (
		<Routes>
			<Route path="/" element={<HomePage />} />
			<Route path="/contacts/:contactId" element={<ContactDetailPage />} />
			<Route
				path="/settings"
				element={
					<Suspense fallback={<SettingsRouteFallback />}>
						<SettingsPage />
					</Suspense>
				}
			/>
			<Route path="*" element={<Navigate to="/" replace />} />
		</Routes>
	);
}
