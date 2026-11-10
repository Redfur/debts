export const IMPORT_BACKUP_NS = "import-backup";

export const importBackupTranslations = {
	en: {
		action: "Load from file",
		confirmTitle: "Load backup?",
		contacts: "Contacts",
		debts: "Debts",
		bills: "Bills",
		createdAt: "Backup created",
		confirmBody:
			"Everything currently recorded on this device will be replaced with the backup data. Unfinished drafts will be deleted.",
		confirmAction: "Replace data",
		success: "Data imported successfully",
		notBackup: "Could not import: this is not a backup file",
		failed: "Could not import: {{message}}",
	},
	ru: {
		action: "Загрузить из файла",
		confirmTitle: "Загрузить резервную копию?",
		contacts: "Контактов",
		debts: "Долгов",
		bills: "Счетов",
		createdAt: "Копия создана",
		confirmBody:
			"Всё, что сейчас записано на этом устройстве, заменится данными из копии. Незавершённые черновики удалятся.",
		confirmAction: "Заменить данные",
		success: "Данные успешно импортированы",
		notBackup: "Не удалось импортировать: это не файл резервной копии",
		failed: "Не удалось импортировать: {{message}}",
	},
} as const;
