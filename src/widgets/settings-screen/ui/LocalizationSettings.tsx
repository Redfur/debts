import { Check, ChevronDown, ChevronRight } from "lucide-react";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { localizationPreferences, useLocalizationPreferences } from "@/shared/lib/localization-preference";
import type { LanguagePreference, NumberFormatPreference } from "@/shared/lib/localization-preference-state";
import { resolveNumberFormat } from "@/shared/lib/localization-preference-state";
import { NUMBER_FORMATS } from "@/shared/lib/number-format";
import { SETTINGS_SCREEN_NS } from "../translations";

export function LocalizationSettings() {
	const { t } = useTranslation(SETTINGS_SCREEN_NS);
	const preferences = useLocalizationPreferences();
	const languages: { value: LanguagePreference; label: string }[] = [
		{ value: "system", label: t("languageSystem") },
		{ value: "ru", label: "Русский" },
		{ value: "en", label: "English" },
	];
	const formats: { value: NumberFormatPreference; label: string }[] = [
		{
			value: "language",
			label: `${t("numberFormatLanguage")} · ${NUMBER_FORMATS[resolveNumberFormat("language", preferences.language)].example}`,
		},
		...Object.entries(NUMBER_FORMATS).map(([value, descriptor]) => ({
			value: value as NumberFormatPreference,
			label: descriptor.example,
		})),
	];
	return (
		<div className="bg-card shadow-card flex flex-col overflow-hidden rounded-[20px] lg:rounded-none lg:bg-transparent lg:shadow-none">
			<PreferenceRow
				title={t("languageLabel")}
				value={preferences.languagePreference}
				displayValue={languages.find((option) => option.value === preferences.languagePreference)?.label ?? ""}
				options={languages}
				onSelect={localizationPreferences.setLanguage}
			/>
			<PreferenceRow
				title={t("numberFormatLabel")}
				value={preferences.numberFormatPreference}
				displayValue={NUMBER_FORMATS[preferences.numberFormat].example}
				options={formats}
				onSelect={localizationPreferences.setNumberFormat}
			/>
		</div>
	);
}

function PreferenceRow<T extends string>({
	title,
	value,
	displayValue,
	options,
	onSelect,
}: {
	title: string;
	value: T;
	displayValue: string;
	options: { value: T; label: string }[];
	onSelect: (value: T) => void;
}) {
	const [open, setOpen] = useState(false);
	const id = useId();
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger
				aria-label={`${title}: ${displayValue}`}
				className="hover:bg-secondary focus-visible:bg-secondary flex min-h-14 w-full items-center gap-3 py-2 pr-3 pl-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset lg:hidden"
			>
				<span className="text-body min-w-0 flex-1">{title}</span>
				<span className="text-muted-foreground max-w-28 shrink-0 text-right text-[15px]">{displayValue}</span>
				<ChevronRight className="text-muted-foreground size-5 shrink-0" aria-hidden="true" />
			</DialogTrigger>
			<div className="hidden min-h-12 items-center gap-3 lg:flex">
				<span className="text-body min-w-0 flex-1 lg:text-[15px]">{title}</span>
				<DialogTrigger
					aria-label={`${title}: ${displayValue}`}
					className="bg-secondary hover:bg-muted flex min-h-11 shrink-0 items-center gap-1.5 rounded-[12px] pr-3 pl-3.5 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					{displayValue}
					<ChevronDown className="size-4" aria-hidden="true" />
				</DialogTrigger>
			</div>
			<DialogContent showCloseButton>
				<DialogTitle className="pr-10">{title}</DialogTitle>
				<DialogDescription className="sr-only">{title}</DialogDescription>
				<RadioGroup
					value={value}
					aria-label={title}
					className="min-h-0 gap-0 overflow-y-auto rounded-control bg-secondary"
					onValueChange={(next) => {
						const option = options.find((option) => option.value === next);
						if (option) {
							onSelect(option.value);
							setOpen(false);
						}
					}}
				>
					{options.map((option) => (
						<label
							key={option.value}
							htmlFor={`${id}-${option.value}`}
							className="hover:bg-muted has-[:focus-visible]:bg-muted flex min-h-13 cursor-pointer items-center gap-3 px-4 py-3 not-last:border-b"
						>
							<RadioGroupItem
								id={`${id}-${option.value}`}
								value={option.value}
								className="sr-only"
								onClick={() => {
									if (option.value === value) setOpen(false);
								}}
							/>
							<span className="min-w-0 flex-1">{option.label}</span>
							{option.value === value ? <Check className="text-accent size-5 shrink-0" aria-hidden="true" /> : null}
						</label>
					))}
				</RadioGroup>
			</DialogContent>
		</Dialog>
	);
}
