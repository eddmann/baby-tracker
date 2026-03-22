import { ReactNode, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "full";
  showHandle?: boolean;
}

const sizeStyles = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  full: "max-w-none mx-4",
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showHandle = true,
}: ModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full",
          sizeStyles[size],
          "bg-[var(--color-surface)]",
          "rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)]",
          "shadow-[var(--shadow-lg)]",
          "animate-slide-in-bottom sm:animate-scale-in",
          "max-h-[90vh] overflow-hidden",
          "flex flex-col",
        )}
      >
        {showHandle && (
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-9 h-1 bg-[var(--color-text-tertiary)]/30 rounded-full" />
          </div>
        )}
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
            <h2 className="text-[17px] font-semibold text-[var(--color-text-primary)]">
              {title}
            </h2>
            <button
              onClick={onClose}
              className={cn(
                "w-8 h-8 flex items-center justify-center",
                "rounded-full",
                "bg-[var(--color-surface-secondary)]",
                "text-[var(--color-text-secondary)]",
                "hover:bg-[var(--color-border)]",
                "transition-colors duration-200",
                "press-effect",
              )}
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}
        <div className="overflow-y-auto overscroll-contain flex-1">
          <div className="p-5">{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default Modal;
