import type { NiceModalHandler } from "@ebay/nice-modal-react";

/** hide завершается только после фактического закрытия адаптивного окна. */
export function useModalClose(modal: NiceModalHandler) {
	return {
		close: async () => {
			await modal.hide();
		},
		onCloseComplete: () => {
			modal.resolveHide();
			modal.remove();
		},
	};
}
