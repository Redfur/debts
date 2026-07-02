import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
	getThemePreference,
	setThemePreference,
	THEME_CHANGE_EVENT,
	type ThemeChangeDetail,
	type ThemePreference,
} from "@/shared/lib/theme";
import { SETTINGS_SCREEN_NS } from "../translations";

type Props = {
	labelId: string;
};

export function ThemePreferenceSelect({ labelId }: Props) {
	const { t } = useTranslation(SETTINGS_SCREEN_NS);
	const [preference, setPreference] = useState<ThemePreference>(() => getThemePreference());

	useEffect(() => {
		const onChange = (e: Event) => {
			const ce = e as CustomEvent<ThemeChangeDetail>;
			if (ce.detail?.preference) setPreference(ce.detail.preference);
		};
		window.addEventListener(THEME_CHANGE_EVENT, onChange);
		return () => window.removeEventListener(THEME_CHANGE_EVENT, onChange);
	}, []);

	return (
		<Select
			value={preference}
			onValueChange={(v) => {
				if (v !== "system" && v !== "light" && v !== "dark") return;
				setThemePreference(v);
				setPreference(v);
			}}
		>
			<SelectTrigger id="theme-pref-select" aria-labelledby={labelId} className="max-w-full min-w-0 w-full">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="system">{t("themeSystem")}</SelectItem>
				<SelectItem value="light">{t("themeLight")}</SelectItem>
				<SelectItem value="dark">{t("themeDark")}</SelectItem>
			</SelectContent>
		</Select>
	);
}
