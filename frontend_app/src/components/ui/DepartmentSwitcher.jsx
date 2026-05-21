import { useMemo, useState } from "react";
import { useDepartment } from "../../context/useDepartment";

const departmentOptions = [
  { label: "Все отделы", value: "all" },
  { label: "Мужской", value: "Мужской" },
  { label: "Женский", value: "Женский" },
  { label: "Детский", value: "Детский" },
];

function SelectArrow({ open = false, disabled = false }) {
  return (
    <span
      style={{
        width: 18,
        height: 18,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-muted)",
        opacity: disabled ? 0.45 : 1,
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
  );
}

function CustomSelect({
  value,
  options,
  onChange,
  disabled = false,
  placeholder = "Выберите значение",
}) {
  const [open, setOpen] = useState(false);

  const selectedOption =
    options.find((option) => option.value === value) || options[0];

  const handleToggle = () => {
    if (disabled) return;
    setOpen((prev) => !prev);
  };

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setOpen(false);
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
      }}
    >
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        style={{
          width: "100%",
          minHeight: 42,
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "10px 12px",
          background: disabled ? "var(--surface-2)" : "var(--surface)",
          color: disabled ? "var(--text-muted)" : "var(--text)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          cursor: disabled ? "not-allowed" : "pointer",
          fontSize: 14,
          fontWeight: 600,
          textAlign: "left",
          outline: "none",
          boxShadow: open ? "0 0 0 3px rgba(0, 0, 0, 0.04)" : "none",
          transition: "border-color 0.18s ease, box-shadow 0.18s ease",
        }}
      >
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {selectedOption?.label || placeholder}
        </span>

        <SelectArrow open={open} disabled={disabled} />
      </button>

      {open && !disabled && (
        <>
          <button
            type="button"
            aria-label="Закрыть список"
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 20,
              background: "transparent",
              border: 0,
              padding: 0,
              cursor: "default",
            }}
          />

          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "calc(100% + 8px)",
              zIndex: 30,
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
        </>
      )}
    </div>
  );
}

export default function DepartmentSwitcher() {
  const {
    department,
    setDepartment,
    subdepartment,
    setSubdepartment,
  } = useDepartment();

  const subdepartmentOptions = useMemo(() => {
    if (department === "Детский") {
      return [
        { label: "Все подотделы", value: "all" },
        { label: "Девочки", value: "Девочки" },
        { label: "Мальчики", value: "Мальчики" },
        { label: "Малыши", value: "Малыши" },
      ];
    }

    if (department === "Мужской") {
      return [
        { label: "Все подотделы", value: "all" },
        { label: "Мужской", value: "Мужской" },
      ];
    }

    if (department === "Женский") {
      return [
        { label: "Все подотделы", value: "all" },
        { label: "Женский", value: "Женский" },
      ];
    }

    return [{ label: "Все подотделы", value: "all" }];
  }, [department]);

  const handleDepartmentChange = (nextDepartment) => {
    setDepartment(nextDepartment);
    setSubdepartment("all");
  };

  return (
    <div className="section-stack">
      <div className="card" style={{ padding: 12 }}>
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
          Отдел
        </label>

        <CustomSelect
          value={department}
          options={departmentOptions}
          onChange={handleDepartmentChange}
        />
      </div>

      <div className="card" style={{ padding: 12 }}>
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
          Подотдел
        </label>

        <CustomSelect
          value={subdepartment}
          options={subdepartmentOptions}
          onChange={setSubdepartment}
          disabled={department === "all"}
        />
      </div>
    </div>
  );
}