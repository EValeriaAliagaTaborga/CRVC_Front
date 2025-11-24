// src/components/ActionGroup.tsx
import React from "react";
import classNames from "classnames";

type ActionItem = {
  label: string;
  href?: string; // si está, renderiza <a>
  onClick?: (e?: React.MouseEvent) => void; // si está, renderiza <button>
  ariaLabel?: string;
  // variante para color: 'primary' => azul, 'danger' => rojo, 'link' => texto
  variant?: "primary" | "danger" | "link";
};

interface Props {
  primary: ActionItem;
  secondary?: ActionItem | null;
  className?: string;
}

/**
 * ActionGroup
 * - Móvil: botones apilados (w-full) para facilitar el tap.
 * - Desktop: inline (row) con estilos compactos (links + pequeño botón).
 */
export default function ActionGroup({ primary, secondary, className }: Props) {
  const renderItem = (item: ActionItem, isPrimary: boolean) => {
    const base = "inline-flex items-center justify-center px-3 py-2 rounded text-sm font-medium";
    const mobileFull = "w-full";
    const desktopInline = "md:w-auto";

    const variantClasses =
      item.variant === "danger"
        ? "bg-red-600 text-white hover:bg-red-700"
        : item.variant === "link"
        ? "text-sky-600 hover:underline bg-transparent"
        : "bg-sky-600 text-white hover:bg-sky-700";

    // On mobile show block-like button; on md+ show inline style (anchor or button)
    const classes = classNames(
      base,
      mobileFull,
      desktopInline,
      // spacing when there are two items: on md show inline gap, on mobile stacked we add mt to second
      { "mt-2 md:mt-0 md:ml-2": !isPrimary && !!primary },
      // variant
      variantClasses,
      // subtle border for link variant on md
      { "bg-transparent text-sky-600 hover:underline px-1 py-0": item.variant === "link" }
    );

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
        onClick={item.onClick}
        className={classes}
        aria-label={item.ariaLabel || item.label}
      >
        {item.label}
      </button>
    );
  };

  return (
    <div className={classNames("flex flex-col md:flex-row md:items-center", className)}>
      {renderItem(primary, true)}
      {secondary && renderItem(secondary, false)}
    </div>
  );
}