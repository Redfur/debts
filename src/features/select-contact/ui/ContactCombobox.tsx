import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDebtStore } from "@/entities/debt";
import { cn } from "@/shared/lib/utils";
import { SELECT_CONTACT_NS } from "../translations";

type Props = {
	value: string | undefined;
	onChange: (contactId: string) => void;
};

export function ContactCombobox({ value, onChange }: Props) {
	const { t } = useTranslation(SELECT_CONTACT_NS);
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const contactsById = useDebtStore((s) => s.contactsById);
	const getOrCreateContact = useDebtStore((s) => s.getOrCreateContact);

	const contacts = useMemo(
		() =>
			Object.values(contactsById)
				.filter((c) => !c.archivedAt)
				.sort((a, b) => a.name.localeCompare(b.name, "ru")),
		[contactsById],
	);

	const selected = value ? contactsById[value] : undefined;
	const trimmedSearch = search.trim();
	const filtered = trimmedSearch
		? contacts.filter((c) => c.name.toLowerCase().includes(trimmedSearch.toLowerCase()))
		: contacts;
	const exactMatch = contacts.some((c) => c.name.toLowerCase() === trimmedSearch.toLowerCase());

	const handleSelectExisting = (contactId: string) => {
		onChange(contactId);
		setOpen(false);
		setSearch("");
	};

	const handleCreate = async () => {
		const id = await getOrCreateContact(trimmedSearch);
		if (id) {
			onChange(id);
			setOpen(false);
			setSearch("");
		}
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					type="button"
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-full justify-between font-normal"
				>
					{selected ? selected.name : t("placeholder")}
					<ChevronsUpDown className="opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-(--radix-popover-trigger-width) p-0">
				<Command shouldFilter={false}>
					<CommandInput placeholder={t("searchPlaceholder")} value={search} onValueChange={setSearch} />
					<CommandList>
						{filtered.length === 0 && !trimmedSearch ? <CommandEmpty>{t("empty")}</CommandEmpty> : null}
						<CommandGroup>
							{filtered.map((c) => (
								<CommandItem key={c.id} value={c.id} onSelect={() => handleSelectExisting(c.id)}>
									<Check className={cn(value === c.id ? "opacity-100" : "opacity-0")} />
									{c.name}
								</CommandItem>
							))}
						</CommandGroup>
						{trimmedSearch && !exactMatch ? (
							<CommandGroup>
								<CommandItem value={`__create__${trimmedSearch}`} onSelect={() => void handleCreate()}>
									<Plus />
									{t("createNew", { name: trimmedSearch })}
								</CommandItem>
							</CommandGroup>
						) : null}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
