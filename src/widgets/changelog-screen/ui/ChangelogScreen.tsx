import entries, { type ChangelogEntry, type ChangelogInline } from "virtual:changelog";
import { useTranslation } from "react-i18next";
import { COMMON_NS } from "@/shared/i18n";
import { PageHeader, PageHeaderBackLink, ScreenBody } from "@/shared/layout";
import { formatReleaseDate } from "@/shared/lib/format-date";
import { CHANGELOG_SCREEN_NS } from "../translations";

// Позиции служат ключами для статического содержимого релиза: у фрагментов и пунктов нет состояния и перестановок.
function renderInline(token: ChangelogInline, position: number) {
	if (token.kind === "strong") {
		return (
			<strong key={position} className="font-semibold">
				{inlineContent(token.content)}
			</strong>
		);
	}
	if (token.kind === "code") {
		return (
			<code key={position} className="bg-secondary rounded px-1 py-0.5 font-mono text-[0.9em] break-all">
				{token.text}
			</code>
		);
	}
	return token.text;
}

function inlineContent(tokens: ChangelogInline[]) {
	return tokens.map(renderInline);
}

function ReleaseContent({ entry }: { entry: ChangelogEntry }) {
	const { t } = useTranslation(CHANGELOG_SCREEN_NS);
	function renderBlock(block: ChangelogEntry["blocks"][number], position: number) {
		if (block.kind === "paragraph") return <p key={position}>{inlineContent(block.content)}</p>;
		function renderItem(item: ChangelogInline[], itemPosition: number) {
			return (
				<li key={itemPosition} className="pl-1">
					{inlineContent(item)}
				</li>
			);
		}
		return (
			<div key={position} className="flex flex-col gap-2">
				<h3 className="text-body-s font-semibold">{t(block.title)}</h3>
				<ul className="flex list-disc flex-col gap-2 pl-5 marker:text-muted-foreground">
					{block.items.map(renderItem)}
				</ul>
			</div>
		);
	}
	return <div className="text-body-s flex flex-col gap-4 break-words">{entry.blocks.map(renderBlock)}</div>;
}

export function ChangelogScreen() {
	const { t } = useTranslation(CHANGELOG_SCREEN_NS);
	const { t: tCommon } = useTranslation(COMMON_NS);
	return (
		<ScreenBody className="w-full gap-6 lg:max-w-[760px]">
			<PageHeader title={t("title")} leading={<PageHeaderBackLink to="/settings" ariaLabel={tCommon("back")} />} />
			{entries.length ? (
				<div className="flex flex-col gap-4">
					{entries.map((entry) => (
						<section
							key={entry.version}
							aria-labelledby={`release-${entry.version}`}
							className="bg-card shadow-card flex flex-col gap-4 rounded-card p-5 lg:p-6"
						>
							<div className="flex flex-col gap-1">
								<h2 id={`release-${entry.version}`} className="text-heading">
									{t("version", { version: entry.version })}
								</h2>
								<time dateTime={entry.date} className="text-caption text-muted-foreground">
									{formatReleaseDate(entry.date)}
								</time>
							</div>
							<ReleaseContent entry={entry} />
						</section>
					))}
				</div>
			) : (
				<p className="text-body text-muted-foreground">{t("empty")}</p>
			)}
		</ScreenBody>
	);
}
