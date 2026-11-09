// Изолированный стенд: Vite обслуживает этот файл только по явному URL, в сборку приложения он не входит.
import NiceModal from "@ebay/nice-modal-react";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebtStore } from "@/entities/debt";
import { showAddRepaymentDialog } from "@/features/add-repayment";
import { PayerSheet } from "@/features/create-bill/ui/PayerSheet";
import { showEditDebtDialog } from "@/features/edit-debt";
import { showImportBackupConfirm } from "@/features/import-backup/ui/ImportBackupConfirm";
import { showInstallInstructions } from "@/features/install-app/ui/InstallInstructionsSheet";
import { i18n } from "@/shared/lib/i18n";
import type { CurrencyCode } from "@/shared/lib/storage";
import { CurrencyPicker } from "@/shared/ui/currency-picker";
import { showConfirmActionModal } from "@/shared/ui/modals";
import "@/shared/i18n";
import "@/features/create-bill";
import "@/features/install-app";
import "@/features/import-backup";
import "@/index.css";

const state = {
	store: useDebtStore,
	errors: 0,
	count: 0,
	finished: 0,
	openedBill: "",
	release: () => {},
	fail: () => {},
	debtId: "",
	contactId: "",
};
Object.assign(window, { drawerTest: state });
window.addEventListener("unhandledrejection", () => {
	state.errors++;
});
const deferred = () => {
	state.count++;
	return new Promise<void>((resolve, reject) => {
		state.release = resolve;
		state.fail = () => reject(new Error("Тестовая ошибка"));
	});
};
const confirm = () =>
	showConfirmActionModal({
		title: "Подтверждение",
		body: "Тестовая операция",
		confirmLabel: "Выполнить",
		cancelLabel: "Отмена",
		onConfirm: deferred,
	}).then(() => {
		state.finished++;
	});
const importConfirm = () =>
	showImportBackupConfirm({
		payload: {
			version: 3,
			exportedAt: new Date().toISOString(),
			contacts: [],
			debts: [],
			debtOperations: [],
			bills: [],
			meta: { schemaVersion: 3, ratesCache: null },
		},
		onConfirm: deferred,
	});

function Fixture() {
	const [payer, setPayer] = useState(false);
	const [currency, setCurrency] = useState<CurrencyCode>("RUB");
	const [open, setOpen] = useState(false);
	return (
		<div className="flex flex-col gap-3 p-6">
			<CurrencyPicker
				value={currency}
				onChange={setCurrency}
				topCurrencies={["RUB", "USD"]}
				title="Валюта"
				triggerLabel="Валюта"
			/>
			<output data-test="currency">{currency}</output>
			<Button onClick={() => void confirm()}>Подтвердить</Button>
			<Button onClick={() => void importConfirm()}>Импорт</Button>
			<Button
				onClick={() =>
					void showEditDebtDialog({
						debtId: state.debtId,
						onOpenBill: (id) => {
							state.openedBill = id;
						},
					})
				}
			>
				Изменить
			</Button>
			<Button onClick={() => void showAddRepaymentDialog({ debtId: state.debtId })}>Погасить</Button>
			<Button onClick={() => setPayer(true)}>Плательщик</Button>
			<Button onClick={() => void showInstallInstructions({ onSaveBackup: () => {} })}>Инструкция</Button>
			<PayerSheet
				open={payer}
				onOpenChange={setPayer}
				subtitle="Проверка"
				participantRefs={["me", state.contactId]}
				value="me"
				onPick={() => {}}
			/>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogTrigger asChild>
					<Button>Стенд</Button>
				</DialogTrigger>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Стенд вложенности</DialogTitle>
						<DialogDescription>Проверка слоёв</DialogDescription>
					</DialogHeader>
					<Input aria-label="Ввод" />
					<Select defaultValue="one">
						<SelectTrigger aria-label="Список">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="one">Один</SelectItem>
							<SelectItem value="two">Два</SelectItem>
						</SelectContent>
					</Select>
					<Popover>
						<PopoverTrigger asChild>
							<Button>Открыть popover</Button>
						</PopoverTrigger>
						<PopoverContent>
							<Input aria-label="Поле popover" />
							<Button>Действие popover</Button>
						</PopoverContent>
					</Popover>
					<Button onClick={() => void confirm()}>Независимое окно</Button>
					<DialogClose asChild>
						<Button>Закрыть стенд</Button>
					</DialogClose>
				</DialogContent>
			</Dialog>
		</div>
	);
}
async function start() {
	await useDebtStore.getState().hydrate();
	const contactId = await useDebtStore.getState().getOrCreateContact("Анна");
	if (!contactId) throw new Error("Не удалось создать тестовый контакт");
	state.contactId = contactId;
	const debtId = await useDebtStore.getState().createDebt({
		contactId: state.contactId,
		direction: "owed_to_me",
		amount: 1000,
		currency: "RUB",
		note: "Тестовый долг",
	});
	if (!debtId) throw new Error("Не удалось создать тестовый долг");
	state.debtId = debtId;
	const root = document.getElementById("root");
	if (root)
		createRoot(root).render(
			<I18nextProvider i18n={i18n}>
				<NiceModal.Provider>
					<Fixture />
				</NiceModal.Provider>
			</I18nextProvider>,
		);
}
void start();
