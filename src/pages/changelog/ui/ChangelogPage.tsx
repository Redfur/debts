import { useLayoutEffect } from "react";
import { ChangelogScreen } from "@/widgets/changelog-screen";

export function ChangelogPage() {
	useLayoutEffect(() => {
		window.scrollTo({ top: 0, left: 0, behavior: "instant" });
	}, []);

	return <ChangelogScreen />;
}
