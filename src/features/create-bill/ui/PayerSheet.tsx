import { Users } from "lucide-react";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ParticipantAvatar, useParticipantName } from "@/entities/debt";
import { cn } from "@/shared/lib/utils";
import { CREATE_BILL_NS } from "../translations";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** «<описание> · <сумма> · N участников». */
	subtitle: string;
	participantRefs: string[];
	value: string;
	onPick: (ref: string) => void;
	onSeveral: () => void;
};

/** Шторка «Кто заплатил»: выбор одного плательщика из участников и «Платили несколько». */
export function PayerSheet({ open, onOpenChange, subtitle, participantRefs, value, onPick, onSeveral }: Props) {
	const { t } = useTranslation(CREATE_BILL_NS);
	const nameOf = useParticipantName();
	const titleId = useId();

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[85svh] gap-3 px-2">
				<DialogHeader className="gap-0.5 px-3">
					<DialogTitle id={titleId}>{t("payerSheetTitle")}</DialogTitle>
					<DialogDescription className="text-caption">{subtitle}</DialogDescription>
				</DialogHeader>
				{/* Стрелки меняют выбор, не закрывая шторку; нажатие на строку (или пробел) выбирает и закрывает. */}
				<RadioGroup
					value={value}
					onValueChange={onPick}
					aria-labelledby={titleId}
					className="-mx-0.5 min-h-0 flex-1 gap-0 overflow-y-auto px-0.5"
				>
					{participantRefs.map((ref) => {
						const itemId = `${titleId}-${ref}`;
						return (
							<label
								key={ref}
								htmlFor={itemId}
								onClick={() => onOpenChange(false)}
								onKeyUp={(e) => {
									if (e.key === " ") onOpenChange(false);
								}}
								className={cn(
									"hover:bg-secondary flex min-h-15 w-full cursor-pointer items-center gap-3 rounded-2xl px-3 py-2",
									ref === value && "bg-secondary",
								)}
							>
								<ParticipantAvatar participantRef={ref} className="size-10 text-base" />
								<span className="text-body min-w-0 flex-1 truncate font-medium">{nameOf(ref)}</span>
								<RadioGroupItem id={itemId} value={ref} />
							</label>
						);
					})}
				</RadioGroup>
				<div className="border-t px-2 pt-2.5">
					<Button type="button" variant="secondary" size="lg" className="w-full" onClick={onSeveral}>
						<Users className="size-5" aria-hidden="true" />
						{t("payerSeveralButton")}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
