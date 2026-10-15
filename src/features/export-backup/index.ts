import { injectTranslation } from "@/shared/lib/i18n";
import { EXPORT_BACKUP_NS, exportBackupTranslations } from "./translations";

injectTranslation(EXPORT_BACKUP_NS, exportBackupTranslations as Record<string, Record<string, string>>);

export { useExportBackup } from "./model/use-export-backup";
