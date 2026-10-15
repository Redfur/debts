export const IMPORT_BACKUP_NS = "import-backup";

export const importBackupTranslations = {
	ru: {
		action: "Загрузить из файла",
		confirmTitle: "Загрузить резервную копию?",
		contacts: "Контактов",
		debts: "Долгов",
		bills: "Счетов",
		createdAt: "Копия создана",
		confirmBody: "Всё, что сейчас записано на этом устройстве, заменится данными из копии.",
		confirmAction: "Заменить данные",
		success: "Данные успешно импортированы",
		notBackup: "Не удалось импортировать: это не файл резервной копии",
		failed: "Не удалось импортировать: {{message}}",
	},
} as const;
