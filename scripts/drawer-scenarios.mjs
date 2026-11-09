import assert from "node:assert/strict";
export async function run({ evaluate: e, c, sleep }) {
	const dialogs = "[role=dialog][data-modal-backend], [role=alertdialog][data-modal-backend]";
	const count = () => e(`document.querySelectorAll(${JSON.stringify(dialogs)}).length`);
	const metric = async (width, height = 844) => {
		await c("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 1024 });
		await c("Emulation.setTouchEmulationEnabled", { enabled: width < 1024 });
		await sleep(120);
	};
	const click = async (text) => {
		await e(
			`(()=>{const b=[...document.querySelectorAll('button')].find(x=>(x.textContent.trim()===${JSON.stringify(text)}||x.getAttribute('aria-label')===${JSON.stringify(text)})&&x.getBoundingClientRect().width>0);if(!b)throw Error('Missing button '+${JSON.stringify(text)});b.focus();b.click()})()`,
		);
		await sleep(400);
	};
	const press = async (key) => {
		await c("Input.dispatchKeyEvent", {
			type: "keyDown",
			key,
			code: key,
			windowsVirtualKeyCode: key === "Escape" ? 27 : 9,
		});
		await c("Input.dispatchKeyEvent", { type: "keyUp", key, code: key });
		await sleep(400);
	};
	const point = async (selector) =>
		e(
			`(()=>{const el=[...document.querySelectorAll(${JSON.stringify(selector)})].at(-1);if(!el)throw Error('Missing '+${JSON.stringify(selector)});const r=el.getBoundingClientRect();return {x:r.x+Math.min(20,r.width/2),y:r.y+Math.min(20,r.height/2)}})()`,
		);
	const tap = async (x, y) => {
		await c("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
		await c("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
		await sleep(400);
	};
	const swipe = async ({
		selector = "[data-slot=drawer-handle]",
		distance = 500,
		delay = 25,
		steps = 12,
		cancel = false,
	} = {}) => {
		const r = await point(selector);
		await c("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [r] });
		let movement = 0;
		for (let i = 1; i <= steps; i++) {
			await c("Input.dispatchTouchEvent", {
				type: "touchMove",
				touchPoints: [{ x: r.x, y: r.y + (distance * i) / steps }],
			});
			await sleep(delay);
		}
		movement = await e(
			`(()=>{const el=[...document.querySelectorAll('[data-slot=drawer-popup]')].at(-1);return el?new DOMMatrixReadOnly(getComputedStyle(el).transform).m42:0})()`,
		);
		await c("Input.dispatchTouchEvent", { type: cancel ? "touchCancel" : "touchEnd", touchPoints: [] });
		await sleep(450);
		return movement;
	};
	const input = async (selector, value) => {
		await e(
			`(()=>{const x=[...document.querySelectorAll(${JSON.stringify(selector)})].at(-1);x.focus();x.select()})()`,
		);
		await c("Input.insertText", { text: value });
		await sleep(100);
	};
	const handles = async () => {
		await metric(390);
		for (const name of ["Валюта", "Погасить", "Изменить", "Плательщик", "Инструкция", "Подтвердить", "Импорт"]) {
			await click(name);
			assert.ok(
				await e(
					`(()=>{const r=document.querySelector('[data-slot=drawer-handle]').getBoundingClientRect();return r.width>=44 && r.height>=44})()`,
				),
				name,
			);
			await swipe();
			assert.equal(await count(), 0);
		}
		await click("Валюта");
		assert.equal(await swipe({ selector: "[data-slot=dialog-close] svg", distance: 200 }), 0);
		assert.equal(await count(), 1);
		await e(`window.getSelection().selectAllChildren(document.querySelector('[data-slot=dialog-title]'))`);
		assert.equal(await swipe({ selector: "[data-slot=dialog-title]", distance: 200 }), 0);
		assert.equal(await count(), 1);
		await e(`window.getSelection().removeAllRanges()`);
		await swipe({ selector: "[data-slot=dialog-title]" });
		assert.equal(await count(), 0);
		console.log(
			"PASS handle size and dismissal for all seven consumers; SVG buttons and text selection excluded; free header drags",
		);
	};
	if (process.env.DRAWER_TEST_SECTION === "handles") {
		await handles();
		return;
	}

	if (process.env.DRAWER_TEST_SECTION !== "layers") {
		for (const width of [390, 1023, 1024, 1440]) {
			await metric(width);
			await click("Валюта");
			assert.equal(await count(), 1);
			assert.equal(
				await e(`document.querySelector('[data-modal-backend]').dataset.modalBackend`),
				width < 1024 ? "drawer" : "radix",
			);
			assert.ok(
				await e(
					`!!document.getElementById(document.querySelector('[data-modal-backend]').getAttribute('aria-labelledby'))?.textContent`,
				),
			);
			if (width < 1024)
				assert.ok(await e(`document.querySelector('[data-slot=drawer-handle]').getBoundingClientRect().height>=44`));
			await press("Escape");
			assert.equal(await count(), 0);
		}
		console.log("PASS backend boundaries, naming, single engine, handle target");
		await metric(390);
		await click("Стенд");
		await input("input[aria-label=Ввод]", "Сохранить ввод");
		await metric(1440);
		assert.equal(await e(`document.querySelector('[data-modal-backend]').dataset.modalBackend`), "drawer");
		assert.equal(await e(`document.querySelector('input[aria-label=Ввод]').value`), "Сохранить ввод");
		await click("Закрыть стенд");
		await click("Стенд");
		assert.equal(await e(`document.querySelector('[data-modal-backend]').dataset.modalBackend`), "radix");
		await metric(390);
		assert.equal(await e(`document.querySelector('[data-modal-backend]').dataset.modalBackend`), "radix");
		await click("Закрыть стенд");
		console.log("PASS resize preserves backend and input, next open picks current width, asChild close");
		await click("Валюта");
		await input("input[type=search]", "доллар");
		assert.equal(await swipe({ selector: "input[type=search]", distance: 120 }), 0);
		assert.equal(await count(), 1);
		assert.ok((await swipe({ distance: 28, steps: 8, delay: 100 })) > 0);
		assert.equal(await count(), 1);
		assert.equal(await e(`document.querySelector('input[type=search]').value`), "доллар");
		await swipe({ distance: 120, steps: 8, cancel: true });
		assert.equal(await count(), 1);
		await swipe({ distance: 120, steps: 2, delay: 5 });
		assert.equal(await count(), 0);
		assert.equal(await e(`document.querySelector('[data-test=currency]').textContent`), "RUB");
		await click("Валюта");
		await swipe();
		assert.equal(await count(), 0);
		assert.equal(await e(`document.activeElement.getAttribute('aria-label')`), "Валюта");
		console.log("PASS short return, cancellation, velocity/distance dismiss, unchanged currency, focus return");
		await click("Валюта");
		// Начинаем на свободном заголовке второй группы при ненулевом scrollTop.
		await e(
			`(()=>{const list=document.querySelector('[role=radiogroup]'); const h=list.querySelectorAll('h3')[1]; list.scrollTop=h.getBoundingClientRect().top-list.getBoundingClientRect().top-8;})()`,
		);
		assert.ok(await e(`document.querySelector('[role=radiogroup]').scrollTop>0`));
		assert.equal(await swipe({ selector: "[role=radiogroup]", distance: 400 }), 0);
		assert.equal(await count(), 1);
		assert.equal(await e(`document.querySelector('[role=radiogroup]').scrollTop`), 0);
		await e(`document.querySelector('[role=radiogroup]').scrollTop=0`);
		const moved = await swipe({ selector: "[role=radiogroup]", distance: 500 });
		assert.ok(moved > 0);
		assert.equal(await count(), 0);
		await click("Валюта");
		await e(`document.querySelector('[role=radiogroup]').scrollTop=700`);
		await swipe();
		assert.equal(await count(), 0);
		console.log("PASS scrolled gesture stays scroll at top, new gesture at top dismisses, handle ignores scroll");
		for (const theme of ["light", "dark"])
			for (const width of [390, 1440]) {
				await metric(width);
				await e(`document.documentElement.classList.toggle('dark',${theme === "dark"})`);
				for (const name of ["Валюта", "Погасить", "Изменить", "Плательщик", "Инструкция", "Подтвердить", "Импорт"]) {
					await click(name);
					assert.equal(await count(), 1, `${theme} ${width} ${name}`);
					assert.ok(await e(`document.querySelector('[data-modal-backend]').textContent.trim().length>0`));
					if (name === "Подтвердить" || name === "Импорт") {
						assert.equal(await e(`document.activeElement.dataset.slot`), "alert-dialog-cancel");
						await tap(5, 5);
						assert.equal(await count(), 1);
						assert.equal(await e("drawerTest.count"), 0);
					}
					if (width === 390) await swipe();
					else await press("Escape");
					assert.equal(await count(), 0, `${name} closed`);
					await click(name);
					await press("Escape");
					assert.equal(await count(), 0, `${name} reopened`);
				}
			}
		console.log("PASS seven consumers in both themes and sizes, confirmation safe focus/backdrop, reopen lifecycle");
		await metric(390);
		await click("Изменить");
		await input("[role=dialog] input[enterkeyhint=done]", "Новая заметка");
		await e(
			`[...document.querySelectorAll('[role=dialog] button')].find(x=>x.getAttribute('aria-label')?.startsWith('Валюта:')).click()`,
		);
		await sleep(400);
		assert.equal(await count(), 2);
		await swipe();
		assert.equal(await count(), 1);
		assert.equal(await e(`document.querySelector('[role=dialog] input[enterkeyhint=done]').value`), "Новая заметка");
		assert.ok(await e(`document.activeElement.getAttribute('aria-label')?.startsWith('Валюта:')`));
		await press("Escape");
		assert.equal(await count(), 0);
		console.log("PASS nested currency swipe preserves debt fields and focus");
	}

	for (const width of [390, 1440]) {
		await metric(width);
		await click("Стенд");
		await click("Список");
		assert.equal(await e(`!!document.querySelector('[role=listbox]')`), true);
		await press("Escape");
		assert.equal(await count(), 1);
		assert.equal(await e(`!!document.querySelector('[role=listbox]')`), false);
		await click("Открыть popover");
		assert.equal(await e(`!!document.querySelector('input[aria-label="Поле popover"]')`), true);
		await input('input[aria-label="Поле popover"]', "Ввод popover");
		assert.equal(await e(`document.activeElement.getAttribute('aria-label')`), "Поле popover");
		await press("Escape");
		assert.equal(await count(), 1);
		await click("Независимое окно");
		assert.equal(await count(), 2);
		for (let i = 0; i < 5; i++) {
			await press("Tab");
			assert.ok(await e(`!!document.activeElement.closest('[role=alertdialog]')`));
		}
		await press("Escape");
		assert.equal(await count(), 1);
		assert.ok(
			await e(
				`document.body.style.overflowY==='hidden' || document.documentElement.style.overflowY==='hidden' || document.body.hasAttribute('data-scroll-locked')`,
			),
		);
		await click("Закрыть стенд");
		assert.equal(await count(), 0);
	}
	console.log("PASS Radix Select/Popover and independent NiceModal layers");
	for (const width of [390, 1440])
		for (const name of ["Подтвердить", "Импорт"]) {
			await metric(width);
			await click(name);
			const before = await e("drawerTest.count");
			const action = name === "Подтвердить" ? "Выполнить" : "Заменить данные";
			await click(action);
			assert.equal(await count(), 1);
			assert.equal(await e("drawerTest.count"), before + 1);
			await click(action);
			await press("Escape");
			await tap(5, 5);
			if (width === 390) {
				assert.equal(await swipe(), 0);
			}
			assert.equal(await count(), 1);
			assert.equal(await e("drawerTest.count"), before + 1);
			assert.equal(await e(`document.querySelector('[data-slot=alert-dialog-cancel]').disabled`), true);
			await e("drawerTest.release()");
			await sleep(500);
			assert.equal(await count(), 0);
		}
	console.log("PASS pending blocks all dismissal/repeat actions and closes after success");
	// Ошибка отклонённого onConfirm остаётся видимой браузеру; окно снова доступно.
	for (const name of ["Подтвердить", "Импорт"]) {
		await metric(390);
		await click(name);
		const errors = await e("drawerTest.errors");
		await click(name === "Подтвердить" ? "Выполнить" : "Заменить данные");
		await e("drawerTest.fail()");
		await sleep(400);
		assert.equal(await e("drawerTest.errors"), errors + 1);
		assert.equal(await count(), 1);
		assert.equal(await e(`document.querySelector('[data-slot=alert-dialog-cancel]').disabled`), false);
		await press("Escape");
		assert.equal(await count(), 0);
	}
	console.log("PASS rejected operation unlocks without swallowing the error");
	for (const width of [390, 1440])
		for (const kind of ["edit", "repayment"]) {
			await metric(width);
			const action = kind === "edit" ? "updateDebt" : "addRepayment";
			await e(
				`(()=>{const store=drawerTest.store; drawerTest.original=store.getState()[${JSON.stringify(action)}]; store.setState({[${JSON.stringify(action)}]:()=>{drawerTest.count++; return new Promise(resolve=>{drawerTest.release=()=>resolve(true);drawerTest.fail=()=>resolve(false)})}})})()`,
			);
			await click(kind === "edit" ? "Изменить" : "Погасить");
			if (kind === "repayment") await input("[role=dialog] input[inputmode=decimal]", "100");
			const before = await e("drawerTest.count");
			await click("Сохранить");
			await click("Сохранить");
			await press("Escape");
			await click("Отмена");
			if (width === 390) assert.equal(await swipe(), 0);
			assert.equal(await count(), 1);
			assert.equal(await e("drawerTest.count"), before + 1);
			await e("drawerTest.fail()");
			await sleep(300);
			assert.equal(await count(), 1);
			assert.ok((await e("document.body.innerText")).includes("Не удалось сохранить"));
			await click("Сохранить");
			await e("drawerTest.release()");
			await sleep(500);
			assert.equal(await count(), 0);
			await e(`drawerTest.store.setState({[${JSON.stringify(action)}]:drawerTest.original})`);
		}
	console.log("PASS edit/repayment pending, repeat prevention, storage failure and success");
	for (const width of [390, 1440]) {
		await metric(width);
		const billId = await e(
			`(async()=>{drawerTest.previousDebt=drawerTest.debtId;const id=await drawerTest.store.getState().createBill({title:'Проверка перехода',totalAmount:200,currency:'RUB',splitMode:'equal',items:[],discount:null,tips:null,participants:[{ref:'me',paid:200,inSplit:true,shareInput:null},{ref:drawerTest.contactId,paid:0,inSplit:true,shareInput:null}]});if(!id)throw Error('bill not created');drawerTest.debtId=Object.values(drawerTest.store.getState().debtsById).find(d=>d.billId===id).id;return id})()`,
		);
		await click("Изменить");
		await click("Открыть счёт");
		assert.equal(await count(), 0);
		assert.equal(await e("drawerTest.openedBill"), billId);
		await e("drawerTest.debtId=drawerTest.previousDebt");
	}
	console.log("PASS hide resolves before open-bill callback on both backends");

	// Mouse/pointercancel follows the same return path as an interrupted touch drag.
	await metric(390);
	await click("Валюта");
	const p = await point("[data-slot=drawer-handle]");
	await c("Input.dispatchMouseEvent", { type: "mousePressed", x: p.x, y: p.y, button: "left", clickCount: 1 });
	await c("Input.dispatchMouseEvent", { type: "mouseMoved", x: p.x, y: p.y + 60, button: "left", buttons: 1 });
	await e(
		`document.querySelector('[data-slot=drawer-handle]').dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,pointerId:1,pointerType:'mouse'}))`,
	);
	await c("Input.dispatchMouseEvent", { type: "mouseReleased", x: p.x, y: p.y + 60, button: "left", clickCount: 1 });
	await sleep(400);
	assert.equal(await count(), 1);
	await metric(390, 500);
	assert.equal(
		await e(
			`getComputedStyle(document.querySelector('[data-slot=drawer-popup]')).getPropertyValue('--keyboard-inset').trim()`,
		),
		"",
	);
	assert.ok(
		await e(
			`(()=>{const s=document.querySelector('input[type=search]').getBoundingClientRect();const list=document.querySelector('[role=radiogroup]').getBoundingClientRect();return s.top>=0 && s.bottom<500 && list.height>0 && list.bottom<=500})()`,
		),
	);
	await metric(390, 844);
	await press("Escape");
	console.log("PASS pointer cancellation, smaller viewport and no legacy double keyboard inset");

	await metric(390);
	await c("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
	await click("Валюта");
	await swipe();
	assert.equal(await count(), 0);
	await click("Подтвердить");
	await press("Escape");
	assert.equal(await count(), 0);
	await c("Emulation.setEmulatedMedia", { features: [] });
	console.log("PASS reduced motion and lifecycle");
	for (const width of [390, 1440]) {
		await metric(width);
		await click("Подтвердить");
		await click("Выполнить");
		await e(
			`(()=>{const button=[...document.querySelectorAll('#root button')].find(x=>x.textContent==='Подтвердить');drawerTest.removedTrigger=button;drawerTest.triggerParent=button.parentElement;button.remove()})()`,
		);
		await e("drawerTest.release()");
		await sleep(500);
		assert.equal(await count(), 0);
		assert.equal(await e(`document.activeElement.getAttribute('aria-label')`), "Валюта");
		await e(`void drawerTest.triggerParent.appendChild(drawerTest.removedTrigger)`);
	}
	console.log("PASS focus fallback after initiator removal");
	await handles();
}
