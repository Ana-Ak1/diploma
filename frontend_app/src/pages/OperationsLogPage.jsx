import { useEffect, useMemo, useState } from "react";
import MobileLayout from "../components/layout/MobileLayout";
import SectionTitle from "../components/ui/SectionTitle";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import ErrorState from "../components/ui/ErrorState";
import DepartmentSwitcher from "../components/ui/DepartmentSwitcher";
import MetricChip from "../components/ui/MetricChip";
import ListCard from "../components/ui/ListCard";
import StatusBadge from "../components/ui/StatusBadge";
import { useDepartment } from "../context/useDepartment";
import { getOperationsLog } from "../api/operations";
import { translateDepartment } from "../utils/translateDepartment";

const periodOptions = [
  { label: "День", value: "day" },
  { label: "Неделя", value: "week" },
  { label: "Месяц", value: "month" },
];

const typeOptions = [
  { label: "Все", value: "all" },
  { label: "Добавлено в пополнение", value: "replenishment_add" },
  { label: "Вынесено", value: "replenishment_done" },
  { label: "Нет на складе", value: "replenishment_missing" },
  { label: "Приемка", value: "receipt_accept" },
];

function operationLabel(type) {
  if (type === "replenishment_add") return "добавлено в пополнение";
  if (type === "replenishment_done") return "вынесено";
  if (type === "replenishment_missing") return "нет на складе";
  if (type === "receipt_accept") return "приемка";
  return type;
}

function operationTone(type) {
  if (type === "receipt_accept") return "success";
  if (type === "replenishment_done") return "success";
  if (type === "replenishment_missing") return "critical";
  if (type === "replenishment_add") return "high";
  return "neutral";
}

function OperationTypeDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);

  const selectedOption =
    typeOptions.find((option) => option.value === value) || typeOptions[0];

  const handleSelect = (nextValue) => {
    onChange(nextValue);
    setOpen(false);
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        zIndex: open ? 80 : 1,
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        style={{
          width: "100%",
          minHeight: 44,
          borderRadius: 14,
          border: "1px solid var(--border)",
          background: "var(--surface)",
          color: "var(--text)",
          padding: "0 12px",
          boxSizing: "border-box",
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
          {selectedOption.label}
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

      {open ? (
        <>
          <button
            type="button"
            aria-label="Закрыть список"
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 70,
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
              zIndex: 90,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: 6,
              boxShadow: "0 14px 32px rgba(0, 0, 0, 0.14)",
              maxHeight: 240,
              overflowY: "auto",
            }}
          >
            {typeOptions.map((option) => {
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

                  {active ? (
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
                  ) : null}
                </button>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}

export default function OperationsLogPage() {
  const { department, subdepartment } = useDepartment();

  const [period, setPeriod] = useState("week");
  const [operationType, setOperationType] = useState("all");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, [department, subdepartment, period, operationType]);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const data = await getOperationsLog({
        department,
        subdepartment,
        operationType,
        period,
        limit: 100,
      });

      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Не удалось загрузить журнал операций.");
    } finally {
      setLoading(false);
    }
  }

  const preparedItems = useMemo(() => {
    return [...items];
  }, [items]);

  return (
    <MobileLayout title="Журнал">
      <div className="page-shell">
        <SectionTitle eyebrow="операции склада" title="Журнал операций" />

        <DepartmentSwitcher />

        <div
          className="card"
          style={{
            padding: 14,
            position: "relative",
            zIndex: 10,
          }}
        >
          <div className="list-card__eyebrow">фильтры</div>

          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 12, marginBottom: 8, color: "var(--text-muted)" }}>
              Период
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {periodOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPeriod(option.value)}
                  className="secondary-button"
                  style={{
                    minHeight: 38,
                    background:
                      period === option.value ? "var(--surface-2)" : "var(--surface)",
                    borderColor:
                      period === option.value ? "var(--border-strong)" : "var(--border)",
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                marginBottom: 8,
                color: "var(--text-muted)",
              }}
            >
              Тип операции
            </label>

            <OperationTypeDropdown
              value={operationType}
              onChange={setOperationType}
            />
          </div>
        </div>

        {loading ? <LoadingState text="Загружаем журнал операций..." /> : null}
        {error ? <ErrorState text={error} onRetry={loadData} /> : null}

        {!loading && !error && !preparedItems.length ? (
          <EmptyState
            title="Операции не найдены"
            text="По выбранным фильтрам пока нет записей."
          />
        ) : null}

        {!loading && !error && !!preparedItems.length ? (
          <div className="section-stack">
            {preparedItems.map((item) => (
              <ListCard
                key={item.id}
                eyebrow="операция"
                title={item.product_name || "Служебная операция"}
                subtitle={
                  item.full_sku
                    ? `${item.product_sku} · ${item.full_sku}`
                    : "Без привязки к варианту"
                }
              >
                <div
                  style={{
                    marginTop: 12,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <StatusBadge
                    label={operationLabel(item.operation_type)}
                    tone={operationTone(item.operation_type)}
                  />
                  <StatusBadge
                    label={new Date(item.created_at).toLocaleString("ru-RU")}
                    tone="neutral"
                  />
                </div>

                <div className="metric-grid-2" style={{ marginTop: 12 }}>
                  <MetricChip label="Количество" value={item.quantity} />
                  <MetricChip
                    label="Отдел"
                    value={translateDepartment(item.department_name)}
                  />
                  <MetricChip label="Сотрудник" value={item.employee_name || "—"} />
                  <MetricChip label="Комментарий" value={item.comment || "—"} />
                </div>
              </ListCard>
            ))}
          </div>
        ) : null}
      </div>
    </MobileLayout>
  );
}