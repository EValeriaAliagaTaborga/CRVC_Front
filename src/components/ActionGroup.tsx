// src/components/ActionGroup.tsx
import React, { useEffect, useRef, useState } from "react";
import classNames from "classnames";

export type ActionItem = {
  label: string;
  href?: string; // si está, renderiza <a>
  onClick?: (e?: React.MouseEvent) => void; // si está, renderiza <button>
  ariaLabel?: string;
  // variante para color: 'primary' => azul, 'danger' => rojo, 'link' => texto, 'default' => gris
  variant?: "primary" | "danger" | "link" | "default";
};

interface Props {
  primary: ActionItem;
  secondary?: ActionItem | null;
  tertiary?: ActionItem | null;
  className?: string;
}

/**
 * ActionGroup
 * - Móvil: botones apilados (w-full) para facilitar el tap.
 * - Desktop:
 *    - Si hay solo primary/secondary: los muestra inline.
 *    - Si hay tertiary (3 acciones): muestra primary + un dropdown con secondary/tertiary
 */
export default function ActionGroup({ primary, secondary, tertiary, className }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [menuOpen]);

  const variantClasses = (v?: ActionItem["variant"], isCompact = false) => {
    if (v === "danger") return "bg-red-600 text-white hover:bg-red-700";
    if (v === "link") return isCompact ? "text-sky-600 hover:underline bg-transparent px-1 py-0" : "text-sky-600 hover:underline bg-transparent";
    if (v === "default") return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    // primary by default
    return "bg-sky-600 text-white hover:bg-sky-700";
  };

  const renderAnchorOrButton = (item: ActionItem, extraClass = "", isCompact = false) => {
    const base = "inline-flex items-center justify-center rounded text-sm font-medium";
    const sizing = isCompact ? "px-2 py-1" : "px-3 py-2";
    const mobileFull = "w-full";
    const desktopInline = "md:w-auto";
    const classes = classNames(base, sizing, mobileFull, desktopInline, variantClasses(item.variant, isCompact), extraClass);

    if (item.href) {
      return (
        <a
          key={item.label}
          href={item.href}
          className={classes}
          aria-label={item.ariaLabel || item.label}
        >
          {item.label}
        </a>
      );
    }

    return (
      <button
        key={item.label}
        type="button"
        onClick={(e) => {
          try { item.onClick?.(e); } finally { /* no-op */ }
        }}
        className={classes}
        aria-label={item.ariaLabel || item.label}
      >
        {item.label}
      </button>
    );
  };

  // Render when there are <= 2 actions (normal inline on desktop)
  const renderTwo = () => (
    <div className={classNames("flex flex-col md:flex-row md:items-center", className)}>
      {/* primary */}
      <div className="w-full md:w-auto">{renderAnchorOrButton(primary)}</div>

      {/* secondary if exists */}
      {secondary && (
        <div className="w-full md:w-auto md:ml-2">
          {renderAnchorOrButton(secondary)}
        </div>
      )}
    </div>
  );

  // Render when there are 3 actions: primary + menu (desktop). Mobile still stacks all three.
  const renderWithMenu = () => (
    <div className={classNames("flex flex-col md:flex-row md:items-center", className)} ref={menuRef}>
      {/* primary */}
      <div className="w-full md:w-auto">{renderAnchorOrButton(primary)}</div>

      {/* Desktop: menu button */}
      <div className="w-full md:w-auto md:ml-2">
        <div className="relative">
          {/* Menu trigger: on mobile we hide the compact trigger and instead show full stacked buttons */}
          <button
            type="button"
            onClick={() => setMenuOpen((s) => !s)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className={classNames(
              "hidden md:inline-flex items-center justify-center w-full md:w-auto px-3 py-2 rounded text-sm font-medium",
              "bg-gray-100 text-gray-800 hover:bg-gray-200"
            )}
          >
            Acciones
            <svg className="ml-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Dropdown (desktop only) */}
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-40 md:block bg-white border rounded shadow z-50 ring-1 ring-black ring-opacity-5">
              <div className="py-1">
                {secondary && (
                  <div className="px-2 py-1">
                    {secondary.href ? (
                      <a href={secondary.href} className="block px-2 py-1 text-sm text-sky-600 hover:bg-gray-50" aria-label={secondary.ariaLabel || secondary.label}>
                        {secondary.label}
                      </a>
                    ) : (
                      <button onClick={(e) => { secondary.onClick?.(e); setMenuOpen(false); }} className="w-full text-left px-2 py-1 text-sm hover:bg-gray-50">
                        {secondary.label}
                      </button>
                    )}
                  </div>
                )}
                {tertiary && (
                  <div className="px-2 py-1 border-t">
                    {tertiary.href ? (
                      <a href={tertiary.href} className="block px-2 py-1 text-sm text-gray-700 hover:bg-gray-50" aria-label={tertiary.ariaLabel || tertiary.label}>
                        {tertiary.label}
                      </a>
                    ) : (
                      <button onClick={(e) => { tertiary.onClick?.(e); setMenuOpen(false); }} className="w-full text-left px-2 py-1 text-sm hover:bg-gray-50">
                        {tertiary.label}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: stacked secondary + tertiary as full-width buttons (visible only on small screens) */}
      <div className="md:hidden mt-2 space-y-2 w-full">
        {secondary && renderAnchorOrButton(secondary)}
        {tertiary && renderAnchorOrButton(tertiary)}
      </div>
    </div>
  );

  // choose rendering strategy
  if (tertiary) return renderWithMenu();
  return renderTwo();
}