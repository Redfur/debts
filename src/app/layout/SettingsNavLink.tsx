import { Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import { COMMON_NS } from "@/shared/i18n";
import { navLinkClass, navLinkClassMobile } from "./app-shell-nav-styles";

type Props = {
	variant: "sidebar" | "bottom";
};

export function SettingsNavLink({ variant }: Props) {
	const { t } = useTranslation(COMMON_NS);
	if (variant === "sidebar") {
		return (
			<NavLink to="/settings" className={({ isActive }) => navLinkClass({ isActive })}>
				<Settings className="size-5 shrink-0" />
				<span>{t("navSettings")}</span>
			</NavLink>
		);
	}
	return (
		<NavLink to="/settings" className={({ isActive }) => navLinkClassMobile({ isActive })}>
			<Settings className="size-5" />
			<span>{t("navSettings")}</span>
		</NavLink>
	);
}
