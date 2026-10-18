import { Check, Minus, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MAX_EXTRA_PEOPLE, useParticipantName } from "@/entities/debt";
import { cn } from "@/shared/lib/utils";
import { CREATE_BILL_NS } from "../translations";

type Props = {
	/** Все участники счёта, в их порядке. */
	participantRefs: string[];
	/** Отмеченные. */
	refs: string[];
	extraPeople: number;
	/** Подпись группы для экранного диктора: «Кто делит «Кальян»», «Кто делит чаевые». */
	groupLabel: string;
	/** Озвучивание отметки: «Анна Смирнова делит «Кальян»» / «… не делит …». */
	chipLabel: (ref: string, on: boolean) => string;
	onToggle: (ref: string) => void;
	onExtraPeople: (count: number) => void;
	/** После погашений: отметки неактивны, «ещё N» — только если люди без имени есть. */
	locked: boolean;
};

/**
 * Отметки «кто делит» позиции или чаевых и «+ ещё» для людей без имени. Геометрия не зависит от состояния: видимая
 * высота 32 px, зона касания 44 px, отмеченная и неотмеченная одной ширины, «+ ещё» и счётчик — 128 px.
 * Ряды идут вплотную, граница между соседними зонами касания — посередине зазора.
 */
export function BillPeopleChips({
	participantRefs,
	refs,
	extraPeople,
	groupLabel,
	chipLabel,
	onToggle,
	onExtraPeople,
	locked,
}: Props) {
	const nameOf = useParticipantName();

	return (
		<fieldset aria-label={groupLabel} className="m-0 -mx-[3px] flex min-w-0 flex-wrap items-center border-0 p-0">
			{participantRefs.map((ref) => {
				const on = refs.includes(ref);
				return (
					<button
						key={ref}
						type="button"
						aria-pressed={on}
						aria-label={chipLabel(ref, on)}
						disabled={locked}
						onClick={() => onToggle(ref)}
						className="group inline-flex h-11 max-w-full items-center px-[3px] outline-none disabled:cursor-default"
					>
						<span
							className={cn(
								"inline-flex h-8 max-w-[168px] items-center gap-1.5 rounded-full pr-3 pl-2 text-sm font-medium group-focus-visible:ring-2 group-focus-visible:ring-ring",
								locked
									? on
										? "bg-muted text-muted-foreground"
										: "text-muted-foreground shadow-[inset_0_0_0_1px_var(--border)]"
									: on
										? "bg-accent-muted text-accent-strong shadow-[inset_0_0_0_1.5px_var(--accent)]"
										: "bg-(--field-bg,var(--background)) shadow-[inset_0_0_0_1px_var(--border)]",
							)}
						>
							<span
								aria-hidden="true"
								className={cn(
									"flex size-4 shrink-0 items-center justify-center rounded-full",
									locked
										? on
											? "bg-muted-foreground text-card"
											: "shadow-[inset_0_0_0_1.5px_var(--border)]"
										: on
											? "bg-accent text-accent-foreground"
											: "shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--muted-foreground)_55%,transparent)]",
								)}
							>
								{on ? <Check className="size-2.5" strokeWidth={4} /> : null}
							</span>
							<span className="min-w-0 truncate">{nameOf(ref).split(" ")[0]}</span>
						</span>
					</button>
				);
			})}
			<ExtraPeople count={extraPeople} onChange={onExtraPeople} locked={locked} />
		</fieldset>
	);
}

const EXTRA_PILL = "flex h-8 w-32 items-center rounded-full text-sm font-semibold";

/** «+ ещё» без людей без имени; со счётчиком — «− ещё N +» той же ширины; после погашений — только «ещё N». */
function ExtraPeople({
	count,
	onChange,
	locked,
}: {
	count: number;
	onChange: (count: number) => void;
	locked: boolean;
}) {
	const { t } = useTranslation(CREATE_BILL_NS);
	const text = t("extraCount", { count });
	if (locked) {
		return count > 0 ? (
			<span className="inline-flex h-11 items-center px-[3px]">
				<span
					className={cn(
						EXTRA_PILL,
						"text-muted-foreground justify-center font-medium shadow-[inset_0_0_0_1.5px_var(--border)]",
					)}
				>
					{text}
				</span>
			</span>
		) : null;
	}
	if (count === 0) {
		return (
			<button
				type="button"
				aria-label={t("extraAddA11y")}
				onClick={() => onChange(1)}
				className="group inline-flex h-11 items-center px-[3px] outline-none"
			>
				<span
					className={cn(
						EXTRA_PILL,
						"border-muted-foreground/50 text-accent justify-center border-[1.5px] border-dashed group-focus-visible:ring-2 group-focus-visible:ring-ring",
					)}
				>
					{t("extraAdd")}
				</span>
			</button>
		);
	}
	const stepClass =
		"-my-1.5 flex h-11 w-9 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40";
	return (
		<span className="inline-flex h-11 items-center px-[3px]">
			<span
				className={cn(
					EXTRA_PILL,
					"bg-accent-muted text-accent-strong shadow-[inset_0_0_0_1.5px_var(--accent)] tabular-nums",
				)}
			>
				<button type="button" aria-label={t("extraLess")} onClick={() => onChange(count - 1)} className={stepClass}>
					<Minus className="size-3.5" strokeWidth={2.6} aria-hidden="true" />
				</button>
				<span aria-live="polite" className="min-w-0 flex-1 text-center whitespace-nowrap">
					{text}
				</span>
				<button
					type="button"
					aria-label={t("extraMore")}
					disabled={count >= MAX_EXTRA_PEOPLE}
					onClick={() => onChange(count + 1)}
					className={stepClass}
				>
					<Plus className="size-3.5" strokeWidth={2.6} aria-hidden="true" />
				</button>
			</span>
		</span>
	);
}
