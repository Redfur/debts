import { injectTranslation } from "@/shared/lib/i18n";
import { CREATE_BILL_NS, createBillTranslations } from "./translations";

injectTranslation(CREATE_BILL_NS, createBillTranslations as Record<string, Record<string, string>>);

export { BillForm } from "./ui/BillForm";
