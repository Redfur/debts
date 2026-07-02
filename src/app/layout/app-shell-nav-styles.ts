import { cn } from "@/shared/lib/utils";

export const navLinkClass = ({ isActive }: { isActive: boolean }) =>
	cn(
		"text-muted-foreground flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
		isActive && "bg-accent text-foreground",
	);

export const navLinkClassMobile = ({ isActive }: { isActive: boolean }) =>
	cn(
		"text-muted-foreground flex flex-1 flex-col items-center gap-1 rounded-md py-2 text-[11px] font-medium leading-tight sm:text-xs",
		isActive && "bg-accent text-foreground",
	);
