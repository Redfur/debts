import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { navLinkClass, navLinkClassMobile } from "./app-shell-nav-styles";

type Props = {
	to: string;
	label: string;
	icon: LucideIcon;
	isActive: boolean;
	variant: "sidebar" | "bottom";
};

export function AppNavLink({ to, label, icon: Icon, isActive, variant }: Props) {
	const className = variant === "sidebar" ? navLinkClass({ isActive }) : navLinkClassMobile({ isActive });
	const iconClassName = variant === "sidebar" ? "size-5 shrink-0" : "size-5";

	return (
		<Link to={to} className={className} aria-current={isActive ? "page" : undefined}>
			<Icon className={iconClassName} />
			<span>{label}</span>
		</Link>
	);
}
