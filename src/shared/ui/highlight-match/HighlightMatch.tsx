type Props = {
	text: string;
	/** Подстрока поиска; совпадение ищется без учёта регистра, выделяется первое вхождение. */
	query: string;
};

/** Текст с выделенным жирным совпадением поиска. */
export function HighlightMatch({ text, query }: Props) {
	const needle = query.trim().toLowerCase();
	const index = needle ? text.toLowerCase().indexOf(needle) : -1;
	if (index === -1) return <>{text}</>;
	return (
		<>
			{text.slice(0, index)}
			<mark className="bg-transparent font-bold text-inherit">{text.slice(index, index + needle.length)}</mark>
			{text.slice(index + needle.length)}
		</>
	);
}
