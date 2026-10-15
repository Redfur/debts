import { ArrowLeftRight, type LucideIcon, Plus, Split } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { COMMON_NS } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";

type MenuItem = {
	to: string;
	icon: LucideIcon;
	titleKey: "createDebt" | "createBill";
	hintKey: "createDebtHint" | "createBillHint";
};

const ITEMS: readonly MenuItem[] = [
	{ to: "/new", icon: ArrowLeftRight, titleKey: "createDebt", hintKey: "createDebtHint" },
	{ to: "/bills/new", icon: Split, titleKey: "createBill", hintKey: "createBillHint" },
];

/**
 * Круглая кнопка «+» с меню «Новый долг / Разделить счёт» над ней. Пока меню открыто, «+» повёрнут в «×»
 * и называется «Закрыть меню»; закрывают повторное нажатие, нажатие вне меню и Esc (Radix DropdownMenu).
 */
export function CreateFab({ className }: { className?: string }) {
	const { t } = useTranslation(COMMON_NS);
	const { pathname } = useLocation();
	const [open, setOpen] = useState(false);

	return (
		<DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
			<DropdownMenuTrigger
				aria-label={open ? t("closeMenu") : t("create")}
				className={cn(
					"bg-accent text-accent-foreground shadow-card flex size-15 shrink-0 items-center justify-center rounded-full transition-transform outline-none hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-95",
					className,
				)}
			>
				<Plus
					className={cn("size-[26px] transition-transform duration-150", open && "rotate-45")}
					strokeWidth={2.4}
					aria-hidden="true"
				/>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				side="top"
				align="end"
				sideOffset={12}
				className="shadow-raised w-[300px] max-w-[calc(100vw-32px)] rounded-[22px] p-1.5 ring-0"
			>
				{ITEMS.map(({ to, icon: Icon, titleKey, hintKey }) => (
					<DropdownMenuItem
						key={to}
						asChild
						className="focus:bg-secondary min-h-15 gap-3 rounded-2xl px-3 py-2 focus-visible:shadow-[inset_0_0_0_2px_var(--ring)]"
					>
						<Link to={to} state={{ backTo: pathname }}>
							<span className="bg-secondary text-foreground flex size-10 shrink-0 items-center justify-center rounded-xl">
								<Icon className="size-5" aria-hidden="true" />
							</span>
							<span className="flex flex-col">
								<span className="text-[15px] leading-5 font-semibold">{t(titleKey)}</span>
								<span className="text-caption text-muted-foreground">{t(hintKey)}</span>
							</span>
						</Link>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
