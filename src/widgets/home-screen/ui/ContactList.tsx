import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import {
	AmountPill,
	type Contact,
	ContactAvatar,
	type ContactDirectionFilter,
	ContactRow,
	ContactRowList,
	computeContactSummary,
	contactMatchesFilter,
	countContactsByDirection,
	ENTITY_DEBT_NS,
	useDebtStore,
} from "@/entities/debt";
import type { CurrencyCode } from "@/shared/lib/storage";
import { cn } from "@/shared/lib/utils";
import { HOME_SCREEN_NS } from "../translations";

const FILTERS: ContactDirectionFilter[] = ["all", "owed-to-me", "i-owe"];

/**
 * Контакты с непогашенными долгами: фильтр «Все / Мне должны / Я должен»; на десктопе — таблица.
 * Без активных долгов — «всё погашено», а если долгов нет совсем (есть только счета без меня) — пояснение про итоги.
 */
export function ContactList({ hasDebts }: { hasDebts: boolean }) {
	const { t } = useTranslation(HOME_SCREEN_NS);
	const { t: tDebt } = useTranslation(ENTITY_DEBT_NS);
	const contactsById = useDebtStore((s) => s.contactsById);
	const debtsById = useDebtStore((s) => s.debtsById);
	const operationsByDebtId = useDebtStore((s) => s.operationsByDebtId);
	const [filter, setFilter] = useState<ContactDirectionFilter>("all");

	const withActive = useMemo(
		() =>
			Object.values(contactsById)
				.filter((c) => !c.archivedAt && contactMatchesFilter(c.id, "all", debtsById, operationsByDebtId))
				.sort((a, b) => a.name.localeCompare(b.name, "ru")),
		[contactsById, debtsById, operationsByDebtId],
	);
	const counts = useMemo(
		() => countContactsByDirection(withActive, debtsById, operationsByDebtId),
		[withActive, debtsById, operationsByDebtId],
	);
	const contacts = withActive.filter((c) => contactMatchesFilter(c.id, filter, debtsById, operationsByDebtId));

	if (!hasDebts) {
		return (
			<div className="flex flex-col items-center gap-3 px-1 py-5 text-center">
				<p className="text-muted-foreground text-body-s">{t("noDebtsOnlyBills")}</p>
				<Link to="/new" className={cn(buttonVariants({ variant: "secondary" }), "bg-card shadow-card")}>
					{t("emptyAdd")}
				</Link>
			</div>
		);
	}

	if (withActive.length === 0) {
		return (
			<div className="flex flex-col gap-0.5 px-1 py-6 text-center">
				<p className="text-body-s font-medium">{t("allSettled")}</p>
				<p className="text-caption text-muted-foreground">{t("allSettledHint")}</p>
			</div>
		);
	}

	const filterLabel = (f: ContactDirectionFilter) =>
		f === "all" ? t("filterAll") : tDebt(f === "owed-to-me" ? "directionOwedToMe" : "directionIOwe");

	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-wrap items-center justify-between gap-3 lg:mt-2">
				<h2 className="text-heading hidden lg:block lg:text-[20px] lg:leading-7">
					{t("openDebts")} <span className="text-muted-foreground font-medium">{counts.all}</span>
				</h2>
				<fieldset className="flex flex-wrap gap-1.5">
					<legend className="sr-only">{t("filterLabel")}</legend>
					{FILTERS.map((f) => {
						const active = filter === f;
						return (
							<button
								key={f}
								type="button"
								aria-pressed={active}
								onClick={() => setFilter(f)}
								className={cn(
									"touch-target min-h-11 rounded-full px-3.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring lg:min-h-10",
									active
										? "bg-primary text-primary-foreground px-4 font-semibold"
										: "bg-card shadow-card text-foreground font-medium hover:bg-secondary",
								)}
							>
								{filterLabel(f)} <span className={active ? "opacity-70" : "text-muted-foreground"}>{counts[f]}</span>
							</button>
						);
					})}
				</fieldset>
			</div>

			<ContactRowList className="mt-1 lg:hidden">
				{contacts.map((c) => (
					<li key={c.id}>
						<ContactRow contact={c} linkState="home" />
					</li>
				))}
			</ContactRowList>

			<DesktopTable contacts={contacts} />
		</div>
	);
}

function DesktopTable({ contacts }: { contacts: Contact[] }) {
	const { t } = useTranslation(HOME_SCREEN_NS);
	const { t: tDebt } = useTranslation(ENTITY_DEBT_NS);
	const debtsById = useDebtStore((s) => s.debtsById);
	const operationsByDebtId = useDebtStore((s) => s.operationsByDebtId);

	return (
		<div className="bg-card shadow-card hidden overflow-x-auto rounded-[24px] lg:block">
			<table className="w-full min-w-[640px] border-collapse text-[15px]">
				<thead>
					<tr className="text-muted-foreground text-left text-[13px] leading-[18px]">
						<th scope="col" className="px-6 pt-4 pb-2.5 font-medium">
							{t("colContact")}
						</th>
						<th scope="col" className="px-3 pt-4 pb-2.5 font-medium">
							{tDebt("directionOwedToMe")}
						</th>
						<th scope="col" className="px-3 pt-4 pb-2.5 font-medium">
							{tDebt("directionIOwe")}
						</th>
						<th scope="col" className="px-6 pt-4 pb-2.5 text-right font-medium">
							{t("colOpenDebts")}
						</th>
					</tr>
				</thead>
				<tbody>
					{contacts.map((c) => {
						const summary = computeContactSummary(c.id, debtsById, operationsByDebtId);
						const openCount = Object.values(debtsById).filter(
							(d) => d.contactId === c.id && d.status === "active",
						).length;
						return (
							<tr key={c.id} className="border-border border-t">
								<td className="px-6 py-3">
									<Link
										to={`/contacts/${c.id}`}
										state={{ from: "home" }}
										className="flex items-center gap-3 font-medium hover:underline"
									>
										<ContactAvatar contact={c} size="sm" />
										{c.name}
									</Link>
								</td>
								<td className="px-3 py-3">
									<Pills byCurrency={summary.owedToMeByCurrency} direction="owed_to_me" />
								</td>
								<td className="px-3 py-3">
									<Pills byCurrency={summary.owedByMeByCurrency} direction="i_owe" />
								</td>
								<td className="text-muted-foreground px-6 py-3 text-right">{openCount}</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}

function Pills({
	byCurrency,
	direction,
}: {
	byCurrency: Partial<Record<CurrencyCode, number>>;
	direction: "owed_to_me" | "i_owe";
}) {
	const entries = Object.entries(byCurrency) as [CurrencyCode, number][];
	if (entries.length === 0) return <span className="text-muted-foreground">—</span>;
	return (
		<span className="flex flex-wrap gap-1.5">
			{entries.map(([code, amount]) => (
				<AmountPill key={code} amount={amount} currency={code} direction={direction} />
			))}
		</span>
	);
}
