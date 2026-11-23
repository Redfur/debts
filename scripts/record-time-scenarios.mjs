import assert from "node:assert/strict";

export async function run({ evaluate, c, sleep }) {
	await c("Emulation.setTimezoneOverride", { timezoneId: "Europe/Moscow" });
	await c("Emulation.setDeviceMetricsOverride", { width: 320, height: 720, deviceScaleFactor: 1, mobile: true });
	const formats = await evaluate(`(async () => {
		const f = await import('/src/shared/lib/format-date.ts');
		const { localizationPreferences: prefs } = await import('/src/shared/lib/localization-preference.ts');
		const current = new Date(2026, 11, 1);
		const stamp = '2026-11-23T22:35:48Z';
		prefs.setLanguage('ru');
		const ru = f.formatShortDateTime(stamp, current);
		const prior = f.formatShortDateTime(stamp.replace('2026', '2025'), current);
		const calendarOnly = f.formatShortDateTime('2026-11-23', current);
		const service = [f.formatLongDate('2026-11-23'), f.formatMoment(stamp), f.formatDateTimeWithYear(stamp), f.formatReleaseDate('2026-11-23')];
		prefs.setLanguage('en');
		const en = f.formatShortDateTime(stamp, current);
		prefs.setLanguage('ru');
		return { ru, prior, calendarOnly, service, en };
	})()`);
	assert.deepEqual(formats, {
		ru: "24 ноя, 01:35",
		prior: "24 ноя 2025, 01:35",
		calendarOnly: "23 ноя",
		service: ["23 ноября", "24 ноября в 01:35", "24 ноября 2026, 01:35", "23 ноября 2026"],
		en: "24 Nov, 01:35",
	});

	const origin = new URL(await evaluate("location.href")).origin;
	await evaluate(`(async () => {
		const { getStorageAdapter } = await import('/src/shared/lib/storage/index.ts');
		const createdAt = '2023-11-23T22:35:48Z';
		const closedAt = '2023-11-24T19:07:00Z';
		const contact = {id:'anna', name:'Анна', colorValue:'#3b82f6', createdAt, updatedAt:createdAt, archivedAt:null};
		const base = { contactId:contact.id, direction:'owed_to_me', principalAmount:1234567.89, currency:'RUB',
			billId:null, createdAt, updatedAt:createdAt };
		const debts = [{...base, id:'active', note:'Такси', status:'active', closedAt:null},
			{...base, id:'closed', note:'Пицца', status:'closed', closedAt}];
		const bill = {id:'dinner', title:'Ужин', currency:'RUB', totalAmount:1234567.89, splitMode:'equal',
			participants:[{ref:'me',paid:0,inSplit:false,shareInput:null},{ref:contact.id,paid:1234567.89,inSplit:true,shareInput:null}],
			items:[],discount:null,tips:null,manualClosedAt:closedAt,createdAt,updatedAt:closedAt};
		await getStorageAdapter().replaceAll({ contacts:[contact], debts, bills:[bill], contactSettlements:[],
			meta:{schemaVersion:4,ratesCache:null}, debtOperations:[
				...debts.map(d => ({id:'initial-'+d.id,debtId:d.id,kind:'initial',createdAt,amount:d.principalAmount,note:null})),
				{id:'paid', debtId:'closed', kind:'repayment', createdAt:closedAt, amount:base.principalAmount, note:null},
			] });
	})()`);
	const wait = async (expression) => {
		for (let i = 0; i < 80; i++) {
			if (await evaluate(expression)) return;
			await sleep(50);
		}
		assert.fail(`Не дождались ${expression}: ${await evaluate("document.body.innerText")}`);
	};
	const has = (text) => `document.body.innerText.includes(${JSON.stringify(text)})`;
	const fits = async (text) => {
		assert.equal(
			await evaluate(`(() => {
				const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
				const text = ${JSON.stringify(text)};
				for (let node = walker.nextNode(); node; node = walker.nextNode()) {
					const start = node.data.indexOf(text);
					if (start < 0 || !node.parentElement.getClientRects().length) continue;
					const range = document.createRange();
					range.setStart(node, start);
					range.setEnd(node, start + text.length);
					const rects = [...range.getClientRects()].filter(r => r.width > 0);
					if (rects.length && rects.every(r => r.left >= 0 && r.right <= document.documentElement.clientWidth)) return true;
				}
				return false;
			})()`),
			true,
			`Дата и время помещаются: ${text}`,
		);
	};
	const navigate = async (path, text) => {
		await c("Page.navigate", { url: `${origin}${path}` });
		await wait(has(text));
		await fits(text);
	};
	await navigate("/contacts/anna", "24 ноя 2023, 01:35");
	await evaluate("[...document.querySelectorAll('button')].find(b => b.innerText.includes('Пицца')).click()");
	await wait(has("24 ноя 2023, 22:07"));
	await fits("24 ноя 2023, 22:07");
	await navigate("/", "Закрытые");
	await evaluate("[...document.querySelectorAll('button')].find(b => b.innerText.includes('Закрытые')).click()");
	await wait(has("24 ноя 2023, 01:35"));
	await fits("24 ноя 2023, 01:35");
	await navigate("/bills/dinner", "24 ноя 2023, 22:07");
	assert.equal(await evaluate(has("24 ноя 2023, 01:35")), true);
}
