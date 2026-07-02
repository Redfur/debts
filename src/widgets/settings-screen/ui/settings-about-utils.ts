export function displayAppVersion(raw: string): string {
	if (raw.startsWith("v")) {
		return raw.slice(1);
	}
	return raw;
}
