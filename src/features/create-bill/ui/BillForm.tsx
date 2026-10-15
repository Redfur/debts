import { ChevronLeft, Lock } from "lucide-react";
import { type FormEvent, type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { type Bill, ME_REF, useDebtStore } from "@/entities/debt";
import { ParticipantsPicker } from "@/features/select-contact";
import { COMMON_NS } from "@/shared/i18n";
import { formatMoney } from "@/shared/lib/format-amount";
import { useKeyboardInset } from "@/shared/lib/use-keyboard-inset";
import { cn } from "@/shared/lib/utils";
import { FormAlert } from "@/shared/ui/form-message";
import { billToFormState, createEmptyBillForm, toBillInput, useBillForm } from "../model/use-bill-form";
import { CREATE_BILL_NS } from "../translations";
import { BillBasicsSection } from "./BillBasicsSection";
import { BillSplitSection } from "./BillSplitSection";
import { PayerSheet } from "./PayerSheet";

type Props = {
	/** Счёт для изменения; без него — создание. */
	bill?: Bill;
	/** По долгам счёта есть погашения: меняется только «За что». */
	locked?: boolean;
	onSaved: (billId: string) => void;
	onCancel: () => void;
};

/**
 * Форма счёта: на телефоне два шага («1 из 2» — сумма, участники, кто заплатил; «2 из 2» — как делим и итог),
 * от 1024 px — один экран в две колонки с «Отмена» и «Сохранить счёт» в шапке. После погашений — один экран,
 * где меняется только «За что».
 */
export function BillForm({ bill, locked = false, onSaved, onCancel }: Props) {
	const { t } = useTranslation(CREATE_BILL_NS);
	const { t: tCommon } = useTranslation(COMMON_NS);
	const form = useBillForm(() => (bill ? billToFormState(bill) : createEmptyBillForm()));
	const createBill = useDebtStore((s) => s.createBill);
	const updateBill = useDebtStore((s) => s.updateBill);
	const keyboardInset = useKeyboardInset();

	const [step, setStep] = useState<1 | 2>(1);
	const [picking, setPicking] = useState(false);
	const [payerSheetOpen, setPayerSheetOpen] = useState(false);
	const [showErrors, setShowErrors] = useState(false);
	const [saveError, setSaveError] = useState(false);
	const [pending, setPending] = useState(false);

	const { state, validation } = form;
	const errors = validation.errors;
	const title = state.title.trim() || t("untitled");
	const total = Number(state.amount) || 0;
	const totalText = formatMoney(total, state.currency);
	const paidMismatch = errors.includes("paid_mismatch");
	const splitMismatch = errors.includes("split_mismatch");
	const step1Invalid = errors.includes("amount_required") || errors.includes("participants_min");

	const goToStep = (next: 1 | 2) => {
		setStep(next);
		window.scrollTo({ top: 0 });
	};

	const handleNext = () => {
		setShowErrors(true);
		if (step1Invalid || paidMismatch) return;
		goToStep(2);
	};

	const save = async () => {
		if (pending) return;
		if (!locked) {
			setShowErrors(true);
			if (step1Invalid) {
				goToStep(1);
				return;
			}
			if (paidMismatch || splitMismatch) return;
		}
		setPending(true);
		setSaveError(false);
		try {
			let savedId: string | undefined;
			if (bill && locked) {
				const ok = await updateBill(bill.id, { ...bill, title: state.title });
				savedId = ok ? bill.id : undefined;
			} else if (bill) {
				savedId = (await updateBill(bill.id, toBillInput(state))) ? bill.id : undefined;
			} else {
				savedId = await createBill(toBillInput(state));
			}
			if (savedId) onSaved(savedId);
			else setSaveError(true);
		} finally {
			setPending(false);
		}
	};

	const handleSubmit = (event: FormEvent) => {
		event.preventDefault();
		if (!locked && step === 1) {
			// Enter на первом шаге телефона — «Далее»; на десктопе кнопки «Далее» нет, но Enter тоже не сохраняет.
			if (window.matchMedia("(min-width: 1024px)").matches) void save();
			else handleNext();
			return;
		}
		void save();
	};

	if (picking) {
		return (
			<ParticipantsPicker
				value={state.participants.filter((p) => p.ref !== ME_REF).map((p) => p.ref)}
				onCancel={() => setPicking(false)}
				onDone={(ids) => {
					form.setContacts(ids);
					setPicking(false);
				}}
			/>
		);
	}

	const heading = bill ? t("titleEdit") : t("titleCreate");
	const saveLabel = locked ? t("saveLocked") : t("save");
	const saveDisabled = pending || (!locked && (paidMismatch || splitMismatch));
	const nameOfCount = t("participantsCount", { count: state.participants.length });

	return (
		<form noValidate className="mx-auto flex w-full max-w-xl flex-1 flex-col lg:max-w-[1080px]" onSubmit={handleSubmit}>
			<div className="flex flex-col gap-4 pt-[env(safe-area-inset-top,0px)] lg:gap-6 lg:pt-9">
				{/* Шапка телефона: «Отмена» или «назад» к шагу 1, заголовок, номер шага. */}
				<header className="grid min-h-11 grid-cols-[1fr_auto_1fr] items-center pt-2 lg:hidden">
					{step === 2 && !locked ? (
						<button
							type="button"
							aria-label={tCommon("back")}
							onClick={() => goToStep(1)}
							className="-ml-2.5 flex size-11 items-center justify-center justify-self-start rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							<ChevronLeft className="size-6" strokeWidth={2.2} aria-hidden="true" />
						</button>
					) : (
						<button
							type="button"
							onClick={onCancel}
							className="text-body -ml-1 flex min-h-11 items-center justify-self-start rounded-md px-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							{tCommon("cancel")}
						</button>
					)}
					<h1 className="text-heading max-w-[240px] truncate text-center">
						{step === 2 && !locked ? t("headerStep2", { title, amount: totalText }) : heading}
					</h1>
					<span className="text-caption text-muted-foreground justify-self-end">
						{locked ? null : step === 1 ? t("step1") : t("step2")}
					</span>
				</header>

				{/* Шапка десктопа: заголовок, «Отмена» и «Сохранить». */}
				<header className="hidden flex-wrap items-center justify-between gap-3 lg:flex">
					<h1 className="text-title-desktop">{heading}</h1>
					<div className="flex gap-2">
						<Button type="button" variant="secondary" className="bg-card shadow-card" onClick={onCancel}>
							{tCommon("cancel")}
						</Button>
						<Button type="button" variant="accent" disabled={saveDisabled} onClick={() => void save()}>
							{saveLabel}
						</Button>
					</div>
				</header>

				{locked ? (
					<div
						role="note"
						className="bg-card text-muted-foreground shadow-card flex gap-2.5 rounded-[16px] px-3.5 py-3 lg:max-w-[calc(50%-10px)]"
					>
						<Lock className="mt-px size-[18px] shrink-0" aria-hidden="true" />
						<span className="text-caption">{t("lockedNote")}</span>
					</div>
				) : null}

				<div className="grid gap-5 lg:grid-cols-2 lg:items-start">
					<DesktopColumn title={t("column1")} hidden={step === 2 && !locked}>
						<BillBasicsSection
							form={form}
							locked={locked}
							showErrors={showErrors}
							onAddParticipants={() => setPicking(true)}
							onChangePayer={() => setPayerSheetOpen(true)}
						/>
					</DesktopColumn>
					{locked ? null : (
						<DesktopColumn title={t("column2")} hidden={step === 1}>
							<BillSplitSection form={form} />
						</DesktopColumn>
					)}
				</div>

				{saveError ? <FormAlert className="hidden lg:flex">{t("saveError")}</FormAlert> : null}
			</div>

			{/* Над клавиатурой: Chrome сжимает layout (interactive-widget), iOS — отступ по visualViewport. */}
			<div
				className="bg-background sticky z-10 mt-auto -mx-4 flex flex-col gap-2 px-4 pt-2.5 pb-3 lg:hidden"
				style={{ bottom: keyboardInset }}
			>
				{step === 1 && !locked ? (
					<>
						{paidMismatch && validation.paidRemainingCents > 0 ? (
							<span id="bill-next-hint" className="text-caption text-muted-foreground text-center">
								{t("paidHint", { amount: formatMoney(validation.paidRemainingCents / 100, state.currency) })}
							</span>
						) : null}
						<Button
							type="button"
							variant="accent"
							size="lg"
							className="w-full"
							disabled={paidMismatch}
							aria-describedby={paidMismatch ? "bill-next-hint" : undefined}
							onClick={handleNext}
						>
							{t("next")}
						</Button>
					</>
				) : (
					<>
						{saveError ? <FormAlert>{t("saveError")}</FormAlert> : null}
						{!locked && splitMismatch ? (
							<span id="bill-save-hint" className="text-caption text-muted-foreground text-center">
								{t("saveHint")}
							</span>
						) : null}
						<Button
							type="submit"
							variant="accent"
							size="lg"
							className="w-full"
							disabled={saveDisabled}
							aria-describedby={!locked && splitMismatch ? "bill-save-hint" : undefined}
						>
							{saveLabel}
						</Button>
					</>
				)}
			</div>

			<PayerSheet
				open={payerSheetOpen}
				onOpenChange={setPayerSheetOpen}
				subtitle={[title, total > 0 ? totalText : null, nameOfCount].filter(Boolean).join(" · ")}
				participantRefs={state.participants.map((p) => p.ref)}
				value={state.payerRef}
				onPick={form.setPayer}
				onSeveral={() => {
					form.setPayerMode("several");
					setPayerSheetOpen(false);
				}}
			/>
		</form>
	);
}

/**
 * Колонка десктопа — белая карточка с подзаголовком; внутренние карточки на ней становятся серыми.
 * Исходный цвет карточки сохраняется в `--card-raised` для выбранного сегмента и полей сумм (`--field-bg`).
 */
function DesktopColumn({ title, hidden, children }: { title: string; hidden: boolean; children: ReactNode }) {
	return (
		<section
			className={cn(
				"lg:bg-card lg:shadow-card lg:rounded-[24px] lg:p-6 lg:[--card-raised:var(--card)]",
				hidden && "max-lg:hidden",
			)}
		>
			<div className="flex flex-col gap-5 lg:[--card:var(--background)] lg:[--field-bg:var(--card-raised)] lg:[--secondary:var(--muted)] lg:[--shadow-card:none] lg:[&_[data-slot=segmented-control-item][data-state=on]]:bg-(--card-raised)">
				<h2 className="text-caption text-muted-foreground hidden font-semibold lg:block">{title}</h2>
				{children}
			</div>
		</section>
	);
}
