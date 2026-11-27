import { useEffect, useState } from "react";
import { TOAST_EVENT, type ToastMessage } from "@/lib/toast";

export function ToastViewport() {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToast = (event: Event) => {
      const message = (event as CustomEvent<ToastMessage>).detail;
      setMessages((current) => [...current.slice(-3), message]);
    };
    window.addEventListener(TOAST_EVENT, handleToast);
    return () => window.removeEventListener(TOAST_EVENT, handleToast);
  }, []);

  useEffect(() => {
    const timers = messages.map((message) =>
      window.setTimeout(
        () => setMessages((current) => current.filter((item) => item.id !== message.id)),
        message.duration ?? 4200,
      ),
    );
    return () => timers.forEach(window.clearTimeout);
  }, [messages]);

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
      aria-live="polite"
      aria-relevant="additions"
    >
      {messages.map((message) => (
        <div
          key={message.id}
          className="syn-toast-enter rounded-md border border-border bg-card px-4 py-3 text-card-foreground shadow-xl"
          data-type={message.kind}
          role={message.kind === "error" ? "alert" : "status"}
        >
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{message.title}</p>
              {message.description && (
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {message.description}
                </p>
              )}
            </div>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground"
              aria-label="Dismiss notification"
              onClick={() =>
                setMessages((current) => current.filter((item) => item.id !== message.id))
              }
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}