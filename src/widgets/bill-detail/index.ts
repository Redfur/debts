import { injectTranslation } from "@/shared/lib/i18n";
import { BILL_DETAIL_NS, billDetailTranslations } from "./translations";

injectTranslation(BILL_DETAIL_NS, billDetailTranslations as Record<string, Record<string, string>>);

export { BillDetailScreen } from "./ui/BillDetailScreen";
export { BillDetailSkeleton, BillNotFound } from "./ui/BillDetailStates";
