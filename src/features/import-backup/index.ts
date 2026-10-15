import { injectTranslation } from "@/shared/lib/i18n";
import { IMPORT_BACKUP_NS, importBackupTranslations } from "./translations";

injectTranslation(IMPORT_BACKUP_NS, importBackupTranslations as Record<string, Record<string, string>>);

export { useImportBackup } from "./model/use-import-backup";
