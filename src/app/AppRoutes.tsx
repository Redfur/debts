import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { HomePage } from "@/pages/home";

import "@/widgets/home-screen";
import "@/widgets/contact-detail";
import {
	BillDetailRouteFallback,
	BillFormRouteFallback,
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

const ContactsIndexPage = lazy(async () => {
	const m = await import("@/pages/contacts");
	return { default: m.ContactsIndexPage };
});

const CreateDebtPage = lazy(async () => {
	const m = await import("@/pages/create-debt");
	return { default: m.CreateDebtPage };
});

const CreateBillPage = lazy(async () => {
	const m = await import("@/pages/create-bill");
	return { default: m.CreateBillPage };
});

const EditBillPage = lazy(async () => {
	const m = await import("@/pages/edit-bill");
	return { default: m.EditBillPage };
});

const BillDetailPage = lazy(async () => {
	const m = await import("@/pages/bill-detail");
	return { default: m.BillDetailPage };
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
				path="/bills/new"
				element={
					<Suspense fallback={<BillFormRouteFallback />}>
						<CreateBillPage />
					</Suspense>
				}
			/>
			<Route
				path="/bills/:billId"
				element={
					<Suspense fallback={<BillDetailRouteFallback />}>
						<BillDetailPage />
					</Suspense>
				}
			/>
			<Route
				path="/bills/:billId/edit"
				element={
					<Suspense fallback={<BillFormRouteFallback />}>
						<EditBillPage />
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
			>
				<Route index element={<ContactsIndexPage />} />
				<Route
					path=":contactId"
					element={
						<Suspense fallback={<ContactDetailRouteFallback />}>
							<ContactDetailPage />
						</Suspense>
					}
				/>
			</Route>
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
