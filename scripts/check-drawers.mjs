import { spawn } from "node:child_process";
import { createWriteStream, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";

const profile = mkdtempSync(`${tmpdir()}/debts-drawer-`);
const chrome = spawn(
	process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
	[
		"--headless=new",
		"--no-first-run",
		"--no-default-browser-check",
		"--disable-background-networking",
		"--disable-component-update",
		"--disable-gpu",
		"--remote-debugging-pipe",
		`--user-data-dir=${profile}`,
	],
	{ stdio: ["ignore", "ignore", "pipe", "pipe", "pipe"] },
);
chrome.stderr.pipe(createWriteStream(`${profile}/chrome.log`));
let id = 0,
	buffer = "";
const pending = new Map();
const requests = [];
chrome.stdio[4].on("data", (chunk) => {
	buffer += chunk.toString();
	let end = buffer.indexOf("\0");
	while (end >= 0) {
		const data = JSON.parse(buffer.slice(0, end));
		buffer = buffer.slice(end + 1);
		end = buffer.indexOf("\0");
		if (data.method === "Network.requestWillBeSent") requests.push(data.params.request.url);
		if (data.method === "Runtime.exceptionThrown") console.log("BROWSER ERROR", JSON.stringify(data.params));
		if (data.method === "Page.frameNavigated") console.log("NAV", data.params.frame.url);
		if (data.id) {
			const p = pending.get(data.id);
			pending.delete(data.id);
			data.error ? p?.reject(data.error) : p?.resolve(data.result);
		}
	}
});
chrome.on("exit", (code) => {
	for (const p of pending.values()) p.reject(new Error(`Chrome exited ${code}`));
});
function command(method, params = {}, sessionId) {
	const msg = { id: ++id, method, params, ...(sessionId ? { sessionId } : {}) };
	return new Promise((resolve, reject) => {
		pending.set(msg.id, { resolve, reject });
		chrome.stdio[3].write(`${JSON.stringify(msg)}\0`);
	});
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
	const target = await command("Target.createTarget", { url: "about:blank" });
	const { sessionId } = await command("Target.attachToTarget", { targetId: target.targetId, flatten: true });
	const c = (m, p) => command(m, p, sessionId);
	const evaluate = async (expression) => {
		const r = await c("Runtime.evaluate", {
			expression:
				expression.includes("await ") && !expression.trim().startsWith("(async")
					? `(async()=>(${expression}))()`
					: expression,
			awaitPromise: true,
			returnByValue: true,
		});
		if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
		return r.result.value;
	};
	await c("Page.enable");
	await c("Runtime.enable");
	await c("Network.enable");
	await c("Network.setBlockedURLs", { urls: ["*cdn.jsdelivr.net*", "*currency-api.pages.dev*"] });
	await c("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
	await c("Page.navigate", { url: process.env.DRAWER_TEST_URL || "http://127.0.0.1:4189/scripts/drawer-fixture.html" });
	await sleep(1800);

	const test = process.argv[2] || new URL("./drawer-scenarios.mjs", import.meta.url).href;
	if (test) {
		const mod = await import(test);
		await mod.run({ evaluate, c, sleep, requests });
	}
	await c("Page.captureScreenshot", { format: "png" }).then((r) =>
		writeFileSync(`${profile}/result.png`, Buffer.from(r.data, "base64")),
	);
	console.log("OK browser checks; isolated profile:", profile);
} finally {
	chrome.kill();
}
