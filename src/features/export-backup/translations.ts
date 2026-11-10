export const EXPORT_BACKUP_NS = "export-backup";

export const exportBackupTranslations = {
	en: { action: "Save to file", success: "Backup saved", failed: "Could not export: {{message}}" },
	ru: {
		action: "Сохранить в файл",
		success: "Резервная копия сохранена",
		failed: "Не удалось экспортировать: {{message}}",
	},
} as const;
