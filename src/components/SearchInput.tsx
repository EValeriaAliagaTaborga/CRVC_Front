import classNames from "classnames";

interface Props {
  id?: string;
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
}

export default function SearchInput({
  id,
  label,
  value,
  onChange,
  placeholder = "Buscar…",
  className,
  "aria-label": ariaLabel,
}: Props) {
  return (
    <div className={classNames("w-full", className)}>
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-gray-600 mb-1">
          {label}
        </label>
      )}

      <div className="relative">
        {/* Icono lupa */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-4 w-4 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
            focusable="false"
          >
            <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
        </div>

        <input
          id={id}
          aria-label={ariaLabel}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={classNames(
            "w-full pl-9 pr-3 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400 placeholder-gray-400",
            // size helpers (puedes overidr con className)
          )}
        />
      </div>
    </div>
  );
}
