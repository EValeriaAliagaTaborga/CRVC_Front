import React, { useEffect } from "react";

interface ModalProps {
  open: boolean;
  title?: React.ReactNode;
  children?: React.ReactNode;
  // acciones opcionales (primaria a la derecha)
  primaryLabel?: string;
  onPrimary?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  // callback cuando se cierra (clic fuera / cerrar)
  onClose?: () => void;
  maxWidthClass?: string; // e.g. "max-w-md", "max-w-lg"
}

/**
 * Modal reutilizable (Tailwind).
 * - open: controla visibilidad
 * - primary/secondary: botones de acción (si no se pasan, no se renderizan)
 * - onClose: se llama al cerrar (botón secundario o overlay)
 */
export default function Modal({
  open,
  title,
  children,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  onClose,
  maxWidthClass = "max-w-md",
}: ModalProps) {
  // cerrar con Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        onClose?.();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => onClose?.()}
        aria-hidden="true"
      />
      <div
        className={`relative w-full ${maxWidthClass} bg-white rounded-xl shadow-xl z-10 overflow-hidden`}
      >
        <div className="p-5">
          {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
          <div className="text-sm text-gray-700">{children}</div>
        </div>

        {/* footer acciones */}
        {(primaryLabel || secondaryLabel) && (
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t bg-gray-50">
            {secondaryLabel && (
              <button
                onClick={() => {
                  onSecondary?.();
                }}
                className="px-4 py-2 rounded border hover:bg-gray-100"
              >
                {secondaryLabel}
              </button>
            )}

            {primaryLabel && (
              <button
                onClick={() => {
                  onPrimary?.();
                }}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                {primaryLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
