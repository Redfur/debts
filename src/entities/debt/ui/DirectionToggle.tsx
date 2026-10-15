import { useId } from "react";
import { useTranslation } from "react-i18next";
import type { DebtDirection } from "@/shared/lib/storage";
import { cn } from "@/shared/lib/utils";
import { ENTITY_DEBT_NS } from "../translations";
import { DirectionIcon } from "./DirectionIcon";

type Props = {
	value: DebtDirection;
	onChange: (direction: DebtDirection) => void;
	/** Подпись группы для экранного диктора. */
	label: string;
	disabled?: boolean;
};

const OPTIONS: DebtDirection[] = ["owed_to_me", "i_owe"];

/** Выбор направления долга двумя крупными кнопками «+ Мне должны» / «− Я должен» (нативные radio). */
export function DirectionToggle({ value, onChange, label, disabled }: Props) {
	const { t } = useTranslation(ENTITY_DEBT_NS);
	const name = useId();

	return (
		<fieldset disabled={disabled} className="m-0 grid min-w-0 grid-cols-2 gap-2 border-0 p-0">
			<legend className="sr-only">{label}</legend>
			{OPTIONS.map((direction) => {
				const checked = value === direction;
				const owedToMe = direction === "owed_to_me";
				return (
					<label
						key={direction}
						className={cn(
							"flex min-h-15 cursor-pointer items-center justify-center gap-2 rounded-control border-2 text-[15px] transition-colors has-[:disabled]:cursor-default has-[:disabled]:opacity-60 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-background",
							checked
								? owedToMe
									? "border-owed-to-me bg-owed-to-me-muted text-owed-to-me-strong font-semibold"
									: "border-i-owe bg-i-owe-muted text-i-owe-strong font-semibold"
								: "bg-card shadow-card text-foreground border-transparent font-medium",
						)}
					>
						<input
							type="radio"
							name={name}
							value={direction}
							checked={checked}
							onChange={() => onChange(direction)}
							className="sr-only"
						/>
						<DirectionIcon direction={direction} className={cn(!checked && "bg-muted text-muted-foreground")} />
						{t(owedToMe ? "directionOwedToMe" : "directionIOwe")}
					</label>
				);
			})}
		</fieldset>
	);
}
