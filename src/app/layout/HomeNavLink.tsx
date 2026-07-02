import { Home } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import { COMMON_NS } from "@/shared/i18n";
import { navLinkClass, navLinkClassMobile } from "./app-shell-nav-styles";

type Props = {
	variant: "sidebar" | "bottom";
};

export function HomeNavLink({ variant }: Props) {
	const { t } = useTranslation(COMMON_NS);

	if (variant === "sidebar") {
		return (
			<NavLink to="/" end className={({ isActive }) => navLinkClass({ isActive })}>
				<Home className="size-5 shrink-0" />
				<span>{t("navHome")}</span>
			</NavLink>
		);
	}

	return (
		<NavLink to="/" end className={({ isActive }) => navLinkClassMobile({ isActive })}>
			<Home className="size-5" />
			<span>{t("navHome")}</span>
		</NavLink>
	);
}
