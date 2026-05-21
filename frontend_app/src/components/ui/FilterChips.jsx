import { useState } from "react";

export default function FilterChips({ value, onChange, options = [] }) {
  const [open, setOpen] = useState(false);

  const selectedOption =
    options.find((option) => option.value === value) || options[0];

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setOpen(false);
  };

  return (
    <div
      className="card"
      style={{
        padding: 12,
        position: "relative",
        zIndex: open ? 50 : 1,
      }}
    >
      <label
        style={{
          display: "block",
          fontSize: 11,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 8,
        }}
      >
        Фильтр
      </label>

      <div style={{ position: "relative", width: "100%" }}>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          style={{
            width: "100%",
            minHeight: 42,
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "10px 12px",
            background: "var(--surface)",
            color: "var(--text)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
            textAlign: "left",
            outline: "none",
            boxShadow: open ? "0 0 0 3px rgba(0, 0, 0, 0.04)" : "none",
          }}
        >
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {selectedOption?.label || "Выберите фильтр"}
          </span>

          <span
            style={{
              width: 18,
              height: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-muted)",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.18s ease",
              flexShrink: 0,
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M7 10L12 15L17 10"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>

        {open && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "calc(100% + 8px)",
              zIndex: 100,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: 6,
              boxShadow: "0 14px 32px rgba(0, 0, 0, 0.14)",
              maxHeight: 220,
              overflowY: "auto",
            }}
          >
            {options.map((option) => {
              const active = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  style={{
                    width: "100%",
                    border: 0,
                    borderRadius: 10,
                    padding: "10px 10px",
                    background: active ? "var(--surface-2)" : "transparent",
                    color: "var(--text)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: active ? 700 : 500,
                    textAlign: "left",
                  }}
                >
                  <span>{option.label}</span>

                  {active && (
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: "var(--text)",
                        opacity: 0.7,
                        flexShrink: 0,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}