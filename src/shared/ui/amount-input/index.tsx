import { type ComponentProps, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { AmountInput as AmountInputControl } from "@/components/ui/amount-input";
import { COMMON_NS } from "@/shared/i18n";
import { useLocalizationPreferences } from "@/shared/lib/localization-preference";
import { NUMBER_FORMATS } from "@/shared/lib/number-format";
import { FieldError } from "@/shared/ui/form-message";

/** Общий потребитель маски: ошибка вставки доступна во всех денежных и процентных полях. */
export function AmountInput(props: ComponentProps<typeof AmountInputControl>) {
	const [pasteError, setPasteError] = useState(false);
	const { numberFormat } = useLocalizationPreferences();
	const { t } = useTranslation(COMMON_NS);
	const errorId = useId();
	return (
		<span className="flex min-w-0 flex-1 flex-col gap-1">
			<AmountInputControl
				{...props}
				aria-invalid={pasteError || props["aria-invalid"]}
				aria-describedby={
					[props["aria-describedby"], pasteError ? errorId : undefined].filter(Boolean).join(" ") || undefined
				}
				onPasteError={(invalid) => {
					setPasteError(invalid);
					props.onPasteError?.(invalid);
				}}
			/>
			{pasteError ? (
				<FieldError id={errorId}>
					{t("invalidNumberPaste", { example: NUMBER_FORMATS[numberFormat].example })}
				</FieldError>
			) : null}
		</span>
	);
}
