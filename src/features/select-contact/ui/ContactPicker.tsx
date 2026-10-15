import { ChevronsUpDown, Plus, Search, UserRound, X } from "lucide-react";
import { type KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	AmountPill,
	type Contact,
	ContactAvatar,
	computeContactSummary,
	type Debt,
	type DebtOperation,
	useDebtStore,
} from "@/entities/debt";
import type { CurrencyCode } from "@/shared/lib/storage";
import { cn } from "@/shared/lib/utils";
import { FieldError } from "@/shared/ui/form-message";
import { HighlightMatch } from "@/shared/ui/highlight-match";
import { SELECT_CONTACT_NS } from "../translations";

type Props = {
	value: string | undefined;
	onChange: (contactId: string) => void;
	/** Поиск раскрыт: форма прячет остальные поля, чтобы список занял экран. */
	onExpandedChange?: (expanded: boolean) => void;
	error?: string;
};

type Option = { kind: "contact"; contact: Contact } | { kind: "create"; name: string };

/**
 * Поле контакта формы долга. Выбранный контакт — карточкой с кнопкой «Выбрать другой контакт»;
 * без контакта или после этой кнопки — поиск, под которым раскрывается список с подсветкой
 * совпадения, остатками и пунктом «Создать «…»».
 */
export function ContactPicker({ value, onChange, onExpandedChange, error }: Props) {
	const { t } = useTranslation(SELECT_CONTACT_NS);
	const inputId = useId();
	const listId = useId();
	const errorId = useId();
	const inputRef = useRef<HTMLInputElement>(null);
	const contactsById = useDebtStore((s) => s.contactsById);
	const debtsById = useDebtStore((s) => s.debtsById);
	const operationsByDebtId = useDebtStore((s) => s.operationsByDebtId);
	const getOrCreateContact = useDebtStore((s) => s.getOrCreateContact);

	const selected = value ? contactsById[value] : undefined;
	const [searching, setSearching] = useState(false);
	const [focused, setFocused] = useState(false);
	const [query, setQuery] = useState("");
	const [activeIndex, setActiveIndex] = useState(-1);

	const showSearch = !selected || searching;
	const trimmed = query.trim();
	const expanded = showSearch && (focused || trimmed !== "");

	useEffect(() => {
		onExpandedChange?.(expanded);
	}, [expanded, onExpandedChange]);

	useEffect(() => {
		if (searching) inputRef.current?.focus();
	}, [searching]);

	const contacts = useMemo(
		() =>
			Object.values(contactsById)
				.filter((c) => !c.archivedAt)
				.sort((a, b) => a.name.localeCompare(b.name, "ru")),
		[contactsById],
	);

	const needle = trimmed.toLowerCase();
	const matches = needle ? contacts.filter((c) => c.name.toLowerCase().includes(needle)) : contacts;
	const exactMatch = contacts.some((c) => c.name.toLowerCase() === needle);
	const options: Option[] = [
		...matches.map((contact) => ({ kind: "contact" as const, contact })),
		...(trimmed && !exactMatch ? [{ kind: "create" as const, name: trimmed }] : []),
	];

	const optionId = (index: number) => `${listId}-${index}`;

	const reset = () => {
		setSearching(false);
		setQuery("");
		setActiveIndex(-1);
		inputRef.current?.blur();
	};

	const choose = async (option: Option) => {
		const id = option.kind === "contact" ? option.contact.id : await getOrCreateContact(option.name);
		if (!id) return;
		onChange(id);
		reset();
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "ArrowDown" || event.key === "ArrowUp") {
			event.preventDefault();
			if (options.length === 0) return;
			const step = event.key === "ArrowDown" ? 1 : -1;
			setActiveIndex((i) => (i + step + options.length) % options.length);
		} else if (event.key === "Enter") {
			// Enter в поиске выбирает пункт, а не отправляет форму.
			event.preventDefault();
			const option = options[activeIndex] ?? (options.length === 1 ? options[0] : undefined);
			if (option) void choose(option);
		} else if (event.key === "Escape" && expanded) {
			event.preventDefault();
			reset();
		}
	};

	if (!showSearch && selected) {
		return (
			<div className="flex flex-col gap-1.5">
				<span className="text-caption text-muted-foreground pl-1">{t("label")}</span>
				<div className="bg-card shadow-card flex min-h-14 items-center gap-3 rounded-control py-1.5 pr-1.5 pl-3">
					<ContactAvatar contact={selected} className="size-8 text-sm" />
					<span className="text-body min-w-0 flex-1 truncate font-medium">{selected.name}</span>
					<button
						type="button"
						aria-label={t("change")}
						onClick={() => setSearching(true)}
						className="text-muted-foreground hover:bg-secondary hover:text-foreground flex size-11 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						<ChevronsUpDown className="size-5" />
					</button>
				</div>
			</div>
		);
	}

	const showEmpty = expanded && contacts.length === 0 && !trimmed;
	const showList = expanded && options.length > 0;

	return (
		<div className="flex flex-col gap-3.5">
			<div className="flex flex-col gap-1.5">
				<label htmlFor={inputId} className="text-caption text-muted-foreground pl-1">
					{t("label")}
				</label>
				<div
					className={cn(
						"bg-card text-muted-foreground flex min-h-14 items-center gap-2.5 rounded-control pr-1.5 pl-3.5 transition-shadow",
						expanded
							? "shadow-[inset_0_0_0_2px_var(--ring)]"
							: error
								? "shadow-[inset_0_0_0_2px_var(--destructive)]"
								: "shadow-card",
					)}
				>
					<Search className="size-5 shrink-0" strokeWidth={2.2} aria-hidden="true" />
					<input
						ref={inputRef}
						id={inputId}
						type="text"
						role="combobox"
						aria-expanded={showList}
						aria-controls={listId}
						aria-autocomplete="list"
						aria-activedescendant={showList && activeIndex >= 0 ? optionId(activeIndex) : undefined}
						aria-invalid={error ? true : undefined}
						aria-describedby={error ? errorId : undefined}
						autoComplete="off"
						autoCapitalize="words"
						enterKeyHint="done"
						placeholder={contacts.length > 0 ? t("searchPlaceholder") : t("newContactPlaceholder")}
						value={query}
						onChange={(e) => {
							setQuery(e.target.value);
							setActiveIndex(-1);
						}}
						onFocus={() => setFocused(true)}
						onBlur={() => {
							setFocused(false);
							// Пустой поиск после «Выбрать другой контакт» — вернуться к выбранному контакту.
							if (!query.trim()) setSearching(false);
						}}
						onKeyDown={handleKeyDown}
						className="text-foreground caret-accent placeholder:text-muted-foreground min-h-11 min-w-0 flex-1 bg-transparent text-[16px] outline-none"
					/>
					{query ? (
						<button
							type="button"
							aria-label={t("clear")}
							onMouseDown={(e) => e.preventDefault()}
							onClick={() => {
								setQuery("");
								setActiveIndex(-1);
								inputRef.current?.focus();
							}}
							className="hover:text-foreground flex size-11 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							<X className="size-5" />
						</button>
					) : null}
				</div>
				{error && !expanded ? <FieldError id={errorId}>{error}</FieldError> : null}
			</div>

			{showEmpty ? (
				<div
					id={listId}
					role="status"
					className="bg-card shadow-card flex items-center gap-3.5 rounded-[20px] px-5 py-5.5"
				>
					<span className="bg-accent-muted text-accent flex size-11 shrink-0 items-center justify-center rounded-full">
						<UserRound className="size-5" aria-hidden="true" />
					</span>
					<span className="flex flex-col gap-0.5">
						<span className="text-body font-semibold">{t("emptyTitle")}</span>
						<span className="text-caption text-muted-foreground">{t("emptyHint")}</span>
					</span>
				</div>
			) : null}

			{showList ? (
				<div
					id={listId}
					role="listbox"
					aria-label={t("listLabel")}
					className="bg-card shadow-card flex flex-col overflow-hidden rounded-[20px]"
				>
					{matches.length === 0 ? (
						<p className="text-caption text-muted-foreground px-4 pt-3.5 pb-1.5">{t("notFound", { query: trimmed })}</p>
					) : null}
					{options.map((option, index) => (
						<button
							key={option.kind === "contact" ? option.contact.id : "__create__"}
							id={optionId(index)}
							type="button"
							role="option"
							tabIndex={-1}
							aria-selected={index === activeIndex}
							// Не забирать фокус у поиска: иначе blur свернёт список до клика.
							onMouseDown={(e) => e.preventDefault()}
							onClick={() => void choose(option)}
							className={cn(
								"hover:bg-secondary aria-selected:bg-secondary flex w-full items-center gap-3 px-4 py-2 text-left outline-none transition-colors",
								option.kind === "contact" ? "min-h-15" : "min-h-14",
								index > 0 && "border-t",
								index > 0 &&
									option.kind === "contact" &&
									"[border-image:linear-gradient(to_right,transparent_64px,var(--border)_64px)_1]",
							)}
						>
							{option.kind === "contact" ? (
								<>
									<ContactAvatar contact={option.contact} className="size-9 text-[15px]" />
									<span className="flex min-w-0 flex-1 flex-col">
										<span className="text-body truncate">
											<HighlightMatch text={option.contact.name} query={trimmed} />
										</span>
										<ContactBalances
											contactId={option.contact.id}
											debtsById={debtsById}
											operationsByDebtId={operationsByDebtId}
										/>
									</span>
								</>
							) : (
								<>
									<span className="bg-accent-muted text-accent flex size-9 shrink-0 items-center justify-center rounded-full">
										<Plus className="size-5" aria-hidden="true" />
									</span>
									<span className="flex min-w-0 flex-col">
										<span className="text-body text-accent truncate font-semibold">
											{t("createNew", { name: option.name })}
										</span>
										{matches.length === 0 ? (
											<span className="text-caption text-muted-foreground">{t("createHint")}</span>
										) : null}
									</span>
								</>
							)}
						</button>
					))}
				</div>
			) : null}
		</div>
	);
}

type BalancesProps = {
	contactId: string;
	debtsById: Record<string, Debt>;
	operationsByDebtId: Record<string, DebtOperation[]>;
};

/** «+10 000 ₽ · −2 300 ₽» — активные остатки контакта по валютам; без долгов ничего не показывает. */
function ContactBalances({ contactId, debtsById, operationsByDebtId }: BalancesProps) {
	const summary = computeContactSummary(contactId, debtsById, operationsByDebtId);
	const items = [
		...(Object.entries(summary.owedToMeByCurrency) as [CurrencyCode, number][]).map(([currency, amount]) => ({
			currency,
			amount,
			direction: "owed_to_me" as const,
		})),
		...(Object.entries(summary.owedByMeByCurrency) as [CurrencyCode, number][]).map(([currency, amount]) => ({
			currency,
			amount,
			direction: "i_owe" as const,
		})),
	];
	if (items.length === 0) return null;
	return (
		<span className="text-caption text-muted-foreground truncate">
			{items.map((item, index) => (
				<span key={`${item.direction}-${item.currency}`}>
					{index > 0 ? " · " : null}
					<AmountPill variant="text" amount={item.amount} currency={item.currency} direction={item.direction} />
				</span>
			))}
		</span>
	);
}
