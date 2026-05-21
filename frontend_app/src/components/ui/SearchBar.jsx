import { Search, X } from "lucide-react";

export default function SearchBar({
  value,
  onChange,
  placeholder = "Поиск",
  onClear,
}) {
  return (
    <div
      className="card"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "14px 14px",
      }}
    >
      <Search size={18} color="var(--text-muted)" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          border: "none",
          outline: "none",
          background: "transparent",
          width: "100%",
          fontSize: 15,
          color: "var(--text)",
        }}
      />
      {value ? (
        <button
          type="button"
          onClick={onClear}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
            padding: 0,
          }}
        >
          <X size={18} color="var(--text-muted)" />
        </button>
      ) : null}
    </div>
  );
}