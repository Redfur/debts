import { Plus, Search, X } from "lucide-react";
import { type KeyboardEvent, useId, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ContactAvatar, useDebtStore } from "@/entities/debt";
import { COMMON_NS } from "@/shared/i18n";
import { useKeyboardInset } from "@/shared/lib/use-keyboard-inset";
import { cn } from "@/shared/lib/utils";
import { HighlightMatch } from "@/shared/ui/highlight-match";
import { SELECT_CONTACT_NS } from "../translations";

type Props = {
	/** Уже отмеченные контакты (без «Я» — пользователь в счёте всегда). */
	value: string[];
	onDone: (contactIds: string[]) => void;
	onCancel: () => void;
};

/**
 * Экран «Участники» (мультивыбор для счёта): отмеченные чипами с «Снять отметку», поиск
 * «Найти или создать контакт», список с галочками и «Создать «<имя>»» — новый контакт сразу отмечается.
 */
export function ParticipantsPicker({ value, onDone, onCancel }: Props) {
	const { t } = useTranslation(SELECT_CONTACT_NS);
	const { t: tCommon } = useTranslation(COMMON_NS);
	const inputId = useId();
	const selectedLabelId = useId();
	const inputRef = useRef<HTMLInputElement>(null);
	const keyboardInset = useKeyboardInset();
	const contactsById = useDebtStore((s) => s.contactsById);
	const getOrCreateContact = useDebtStore((s) => s.getOrCreateContact);

	const [selected, setSelected] = useState<string[]>(value);
	const [query, setQuery] = useState("");

	const contacts = useMemo(
		() =>
			Object.values(contactsById)
				.filter((c) => !c.archivedAt)
				.sort((a, b) => a.name.localeCompare(b.name, "ru")),
		[contactsById],
	);
	const trimmed = query.trim();
	const needle = trimmed.toLowerCase();
	const matches = needle ? contacts.filter((c) => c.name.toLowerCase().includes(needle)) : contacts;
	const canCreate = trimmed !== "" && !contacts.some((c) => c.name.toLowerCase() === needle);
	const selectedContacts = selected.map((id) => contactsById[id]).filter((c) => c !== undefined);

	const toggle = (id: string) =>
		setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

	const create = async () => {
		const name = trimmed;
		const id = await getOrCreateContact(name);
		if (!id) return;
		setSelected((prev) => (prev.includes(id) ? prev : [...prev, id]));
		// Пока контакт записывался, могли начать вводить следующее имя — его не стираем.
		setQuery((current) => (current.trim() === name ? "" : current));
		inputRef.current?.focus();
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key !== "Enter") return;
		event.preventDefault();
		if (canCreate && matches.length === 0) void create();
		else if (matches.length === 1) {
			toggle(matches[0].id);
			setQuery("");
		}
	};

	return (
		<div className="mx-auto flex w-full max-w-xl flex-1 flex-col">
			<div className="flex flex-col gap-3.5 pt-[env(safe-area-inset-top,0px)] lg:pt-6">
				<header className="grid min-h-11 grid-cols-[1fr_auto_1fr] items-center pt-2">
					<button
						type="button"
						onClick={onCancel}
						className="text-body -ml-1 flex min-h-11 items-center justify-self-start rounded-md px-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						{tCommon("cancel")}
					</button>
					<h1 className="text-heading">{t("participantsTitle")}</h1>
					<span />
				</header>

				<div className="flex flex-col gap-2">
					<span id={selectedLabelId} className="text-caption text-muted-foreground pl-1 font-semibold">
						{t("selectedCount", { count: selectedContacts.length })}{" "}
						<span className="font-normal">{t("selectedMeHint")}</span>
					</span>
					{selectedContacts.length > 0 ? (
						<ul aria-labelledby={selectedLabelId} className="flex flex-wrap gap-1.5">
							{selectedContacts.map((contact) => (
								<li
									key={contact.id}
									className="bg-card shadow-card flex min-h-11 max-w-full items-center gap-1.5 rounded-full py-0 pr-0.5 pl-1.5 text-sm font-medium"
								>
									<ContactAvatar contact={contact} className="size-[30px] text-xs" />
									<span className="min-w-0 truncate">{contact.name}</span>
									<button
										type="button"
										aria-label={t("unselect", { name: contact.name })}
										onClick={() => toggle(contact.id)}
										className="text-muted-foreground hover:text-foreground flex size-10 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
									>
										<X className="size-4" strokeWidth={2.2} />
									</button>
								</li>
							))}
						</ul>
					) : null}
				</div>

				<div className="bg-card text-muted-foreground shadow-card focus-within:shadow-[inset_0_0_0_2px_var(--ring)] flex min-h-14 items-center gap-2.5 rounded-control pr-1.5 pl-3.5">
					<Search className="size-5 shrink-0" strokeWidth={2.2} aria-hidden="true" />
					<label htmlFor={inputId} className="sr-only">
						{t("participantsSearch")}
					</label>
					<input
						ref={inputRef}
						id={inputId}
						type="text"
						autoComplete="off"
						autoCapitalize="words"
						enterKeyHint="done"
						placeholder={t("participantsSearch")}
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						onKeyDown={handleKeyDown}
						className="text-foreground caret-accent placeholder:text-muted-foreground min-h-11 min-w-0 flex-1 bg-transparent text-[16px] outline-none"
					/>
					{query ? (
						<button
							type="button"
							aria-label={t("clear")}
							onClick={() => {
								setQuery("");
								inputRef.current?.focus();
							}}
							className="hover:text-foreground flex size-11 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							<X className="size-5" />
						</button>
					) : null}
				</div>

				{matches.length > 0 || canCreate ? (
					<div className="bg-card shadow-card flex flex-col overflow-hidden rounded-[20px] py-1">
						{trimmed && matches.length === 0 ? (
							<p className="text-caption text-muted-foreground px-4 pt-2.5 pb-1.5">
								{t("notFound", { query: trimmed })}
							</p>
						) : null}
						{matches.length > 0 ? (
							<ul aria-label={t("listLabel")}>
								{matches.map((contact, index) => (
									<li key={contact.id} className={cn(index > 0 && "border-t")}>
										<label
											htmlFor={`${inputId}-${contact.id}`}
											className="hover:bg-secondary flex min-h-15 cursor-pointer items-center gap-3 px-4 py-2"
										>
											<ContactAvatar contact={contact} size="sm" />
											<span className="text-body min-w-0 flex-1 truncate font-medium">
												<HighlightMatch text={contact.name} query={trimmed} />
											</span>
											<Checkbox
												id={`${inputId}-${contact.id}`}
												checked={selected.includes(contact.id)}
												onCheckedChange={() => toggle(contact.id)}
												className="size-[26px] rounded-lg"
											/>
										</label>
									</li>
								))}
							</ul>
						) : null}
						{canCreate ? (
							<button
								type="button"
								onClick={() => void create()}
								className={cn(
									"hover:bg-secondary focus-visible:bg-secondary flex min-h-15 w-full items-center gap-3 px-4 py-2 text-left outline-none",
									matches.length > 0 && "border-t",
								)}
							>
								<span className="bg-accent-muted text-accent flex size-9 shrink-0 items-center justify-center rounded-full">
									<Plus className="size-[18px]" strokeWidth={2.4} aria-hidden="true" />
								</span>
								<span className="flex min-w-0 flex-col">
									<span className="text-body text-accent truncate font-semibold">
										{t("createNew", { name: trimmed })}
									</span>
									<span className="text-caption text-muted-foreground">{t("createHintMulti")}</span>
								</span>
							</button>
						) : null}
					</div>
				) : null}
			</div>

			<div
				className="bg-background sticky z-10 mt-auto -mx-4 flex flex-col px-4 pt-2.5 pb-3 lg:static lg:mx-0 lg:mt-0 lg:px-0 lg:pt-6"
				style={{ bottom: keyboardInset }}
			>
				<Button type="button" variant="accent" size="lg" className="w-full" onClick={() => onDone(selected)}>
					{t("done", { count: selectedContacts.length })}
				</Button>
			</div>
		</div>
	);
}
