import { injectTranslation } from "@/shared/lib/i18n";
import { DELETE_BILL_NS, deleteBillTranslations } from "./translations";

injectTranslation(DELETE_BILL_NS, deleteBillTranslations as Record<string, Record<string, string>>);

export { showDeleteBillConfirm } from "./model/show-delete-bill-confirm";
