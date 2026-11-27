export type ToastKind = "success" | "error" | "info";
export type ToastOptions = { description?: string; duration?: number };
export type ToastMessage = ToastOptions & {
  id: number;
  kind: ToastKind;
  title: string;
};

export const TOAST_EVENT = "syntra:toast";
let nextToastId = 0;

function showToast(kind: ToastKind, title: string, options: ToastOptions = {}) {
  window.dispatchEvent(
    new CustomEvent<ToastMessage>(TOAST_EVENT, {
      detail: { ...options, id: ++nextToastId, kind, title },
    }),
  );
}

export const toast = Object.assign(
  (title: string, options?: ToastOptions) => showToast("info", title, options),
  {
    success: (title: string, options?: ToastOptions) => showToast("success", title, options),
    error: (title: string, options?: ToastOptions) => showToast("error", title, options),
    info: (title: string, options?: ToastOptions) => showToast("info", title, options),
  },
);