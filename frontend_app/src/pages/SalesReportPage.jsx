import { useEffect, useMemo, useState } from "react";
import MobileLayout from "../components/layout/MobileLayout";
import SectionTitle from "../components/ui/SectionTitle";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import ErrorState from "../components/ui/ErrorState";
import DepartmentSwitcher from "../components/ui/DepartmentSwitcher";
import PrimaryButton from "../components/ui/PrimaryButton";
import MetricChip from "../components/ui/MetricChip";
import ListCard from "../components/ui/ListCard";
import { useDepartment } from "../context/useDepartment";
import { translateDepartment } from "../utils/translateDepartment";
import { getSalesReport } from "../api/sales";
import { addReplenishmentItem } from "../api/replenishment";

const periodOptions = [
  { label: "День", value: "day" },
  { label: "Неделя", value: "week" },
];

export default function SalesReportPage() {
  const { department, subdepartment } = useDepartment();

  const [period, setPeriod] = useState("day");
  const [onlyInStock, setOnlyInStock] = useState(true);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingId, setAddingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadData();
  }, [period, department, subdepartment, onlyInStock]);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      const data = await getSalesReport({
        period,
        department,
        subdepartment,
        onlyInStock,
        limit: 100,
      });

      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Не удалось загрузить отчет по продажам.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(item) {
    try {
      setAddingId(item.variant_id);
      setError("");
      setSuccessMessage("");

      const resolvedDepartment =
        department === "all"
          ? translateDepartment(item.department_name)
          : department;

      await addReplenishmentItem({
        department_name: resolvedDepartment,
        variant_id: item.variant_id,
        requested_qty: 1,
        source: "sales_report",
        created_by: "Сотрудник склада",
        comment: "Добавлено из отчета по продажам",
      });

      setSuccessMessage(`Добавлено в пополнение: ${item.product_name}`);
    } catch (err) {
      console.error(err);
      setError("Не удалось добавить товар в пополнение.");
    } finally {
      setAddingId(null);
    }
  }

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => b.sold_qty - a.sold_qty);
  }, [items]);

  return (
    <MobileLayout title="Продажи">
      <div className="page-shell">
        <SectionTitle eyebrow="операции склада" title="Отчет по продажам" />

        <DepartmentSwitcher />

        <div className="card" style={{ padding: 14 }}>
          <div className="list-card__eyebrow">период</div>

          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
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

          <label
            style={{
              marginTop: 14,
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontWeight: 600,
            }}
          >
            <input
              type="checkbox"
              checked={onlyInStock}
              onChange={(e) => setOnlyInStock(e.target.checked)}
            />
            Только доступно на складе
          </label>
        </div>

        {successMessage ? (
          <div className="card" style={{ padding: 14 }}>
            <div style={{ fontWeight: 700 }}>{successMessage}</div>
          </div>
        ) : null}

        {loading ? <LoadingState text="Загружаем продажи..." /> : null}
        {error ? <ErrorState text={error} onRetry={loadData} /> : null}

        {!loading && !error && !sortedItems.length ? (
          <EmptyState
            title="Продаж не найдено"
            text="По выбранному периоду и отделу данные отсутствуют."
          />
        ) : null}

        {!loading && !error && !!sortedItems.length ? (
          <div className="section-stack">
            {sortedItems.map((item) => (
              <ListCard
                key={item.variant_id}
                eyebrow="продажи"
                title={item.product_name}
                subtitle={`${item.product_sku} · ${item.full_sku}`}
              >
                <div className="metric-grid-2">
                  <MetricChip label="Продано" value={item.sold_qty} />
                  <MetricChip label="Остаток" value={item.current_stock} />
                  <MetricChip label="Резерв" value={item.reserved_stock} />
                  <MetricChip label="Страховой запас" value={item.safety_stock} />
                </div>

                <div className="metric-grid-2" style={{ marginTop: 10 }}>
                  <MetricChip
                    label="Отдел"
                    value={translateDepartment(item.department_name)}
                  />
                  <MetricChip
                    label="Статус"
                    value={
                      item.current_stock <= item.safety_stock
                        ? "Пополнить срочно"
                        : "В наличии"
                    }
                  />
                </div>

                <div style={{ marginTop: 14 }}>
                  <PrimaryButton fullWidth onClick={() => handleAdd(item)}>
                    {addingId === item.variant_id
                      ? "Добавляем..."
                      : "Добавить в пополнение"}
                  </PrimaryButton>
                </div>
              </ListCard>
            ))}
          </div>
        ) : null}
      </div>
    </MobileLayout>
  );
}