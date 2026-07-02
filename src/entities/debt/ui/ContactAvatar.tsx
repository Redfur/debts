import { firstGrapheme } from "@/shared/lib/first-grapheme";
import { cn } from "@/shared/lib/utils";
import type { Contact } from "../model/types";

type Props = {
	contact: Pick<Contact, "name" | "colorValue">;
	className?: string;
};

export function ContactAvatar({ contact, className }: Props) {
	return (
		<span
			className={cn(
				"inline-flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-medium text-white",
				className,
			)}
			style={{ backgroundColor: contact.colorValue }}
			aria-hidden="true"
		>
			{firstGrapheme(contact.name).toUpperCase()}
		</span>
	);
}
