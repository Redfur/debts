import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { HomePage } from "@/pages/home";

import "@/widgets/home-screen";
import "@/widgets/contact-detail";
import {
	ContactDetailRouteFallback,
	ContactsRouteFallback,
	CreateDebtRouteFallback,
	SettingsRouteFallback,
} from "./route-fallbacks";

const SettingsPage = lazy(async () => {
	const m = await import("@/pages/settings");
	return { default: m.SettingsPage };
});

const ContactDetailPage = lazy(async () => {
	const m = await import("@/pages/contact-detail");
	return { default: m.ContactDetailPage };
});

const ContactsPage = lazy(async () => {
	const m = await import("@/pages/contacts");
	return { default: m.ContactsPage };
});

const CreateDebtPage = lazy(async () => {
	const m = await import("@/pages/create-debt");
	return { default: m.CreateDebtPage };
});

export function AppRoutes() {
	return (
		<Routes>
			<Route path="/" element={<HomePage />} />
			<Route
				path="/new"
				element={
					<Suspense fallback={<CreateDebtRouteFallback />}>
						<CreateDebtPage />
					</Suspense>
				}
			/>
			<Route
				path="/contacts"
				element={
					<Suspense fallback={<ContactsRouteFallback />}>
						<ContactsPage />
					</Suspense>
				}
			/>
			<Route
				path="/contacts/:contactId"
				element={
					<Suspense fallback={<ContactDetailRouteFallback />}>
						<ContactDetailPage />
					</Suspense>
				}
			/>
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
