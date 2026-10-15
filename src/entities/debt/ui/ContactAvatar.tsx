import { avatarPaletteIndex } from "@/shared/config/contact-colors";
import { firstGrapheme } from "@/shared/lib/first-grapheme";
import { cn } from "@/shared/lib/utils";
import type { Contact } from "../model/types";

/** Классы пар токенов `avatar-N` (литералы — чтобы Tailwind их нашёл). */
const AVATAR_CLASSES: Record<number, string> = {
	1: "bg-avatar-1 text-avatar-1-foreground",
	2: "bg-avatar-2 text-avatar-2-foreground",
	3: "bg-avatar-3 text-avatar-3-foreground",
	4: "bg-avatar-4 text-avatar-4-foreground",
	5: "bg-avatar-5 text-avatar-5-foreground",
	6: "bg-avatar-6 text-avatar-6-foreground",
	7: "bg-avatar-7 text-avatar-7-foreground",
	8: "bg-avatar-8 text-avatar-8-foreground",
};

const SIZE_CLASSES = {
	sm: "size-10 text-base",
	md: "size-[42px] text-[17px]",
	lg: "size-14 text-[22px]",
} as const;

type Props = {
	contact: Pick<Contact, "name" | "colorValue">;
	size?: keyof typeof SIZE_CLASSES;
	className?: string;
};

export function ContactAvatar({ contact, size = "md", className }: Props) {
	return (
		<span
			className={cn(
				"inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
				SIZE_CLASSES[size],
				AVATAR_CLASSES[avatarPaletteIndex(contact.colorValue)],
				className,
			)}
			aria-hidden="true"
		>
			{firstGrapheme(contact.name).toUpperCase()}
		</span>
	);
}
