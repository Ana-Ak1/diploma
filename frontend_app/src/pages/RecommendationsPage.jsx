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
import StatusBadge from "../components/ui/StatusBadge";
import { useDepartment } from "../context/useDepartment";
import { getAIRecommendationCenter } from "../api/ai";
import { addReplenishmentItem } from "../api/replenishment";
import { translateDepartment } from "../utils/translateDepartment";

const filterOptions = [
  { label: "Все", value: "all" },
  { label: "Пополнение / поставка", value: "replenish" },
  { label: "Выкладка", value: "transfer" },
  { label: "Слабые товары", value: "markdown" },
  { label: "Наблюдение", value: "hold" },
];

function priorityTone(priority) {
  if (priority === "critical") return "critical";
  if (priority === "high") return "high";
  if (priority === "medium") return "warning";
  return "neutral";
}

function priorityLabel(priority) {
  if (priority === "critical") return "критично";
  if (priority === "high") return "высокий";
  if (priority === "medium") return "средний";
  return "низкий";
}

function recommendationTypeLabel(type, title) {
  if (title) return title;
  if (type === "replenish") return "Пополнение / поставка";
  if (type === "transfer") return "Выкладка";
  if (type === "markdown") return "Слабая оборачиваемость";
  if (type === "hold") return "Наблюдение";
  return type;
}

export default function RecommendationsPage() {
  const { department, subdepartment } = useDepartment();

  const [items, setItems] = useState([]);
  const [selectedType, setSelectedType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [addingId, setAddingId] = useState(null);

  useEffect(() => {
    loadData();
  }, [department, subdepartment]);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      const data = await getAIRecommendationCenter({
        department,
        subdepartment,
        limit: 100,
      });

      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Не удалось загрузить рекомендации.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToReplenishment(item) {
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
        requested_qty: Math.max(item.suggested_quantity || 1, 1),
        source: "ai_recommendation",
        created_by: "Модуль рекомендаций",
        comment: `Добавлено из рекомендаций: ${item.title}`,
      });

      setSuccessMessage(`Добавлено в пополнение: ${item.product_name}`);
    } catch (err) {
      console.error(err);
      setError("Не удалось добавить рекомендацию в лист пополнения.");
    } finally {
      setAddingId(null);
    }
  }

  const filteredItems = useMemo(() => {
    if (selectedType === "all") return items;
    return items.filter((item) => item.recommendation_type === selectedType);
  }, [items, selectedType]);

  return (
    <MobileLayout title="Рекомендации">
      <div className="page-shell">
        <SectionTitle
          eyebrow="центр решений"
          title="Аналитические рекомендации"
        />

        <DepartmentSwitcher />

        <div className="card" style={{ padding: 14 }}>
          <div className="list-card__eyebrow">тип рекомендации</div>
          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {filterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedType(option.value)}
                className="secondary-button"
                style={{
                  minHeight: 38,
                  background:
                    selectedType === option.value
                      ? "var(--surface-2)"
                      : "var(--surface)",
                  borderColor:
                    selectedType === option.value
                      ? "var(--border-strong)"
                      : "var(--border)",
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {successMessage ? (
          <div className="card" style={{ padding: 14 }}>
            <div style={{ fontWeight: 700 }}>{successMessage}</div>
          </div>
        ) : null}

        {loading ? <LoadingState text="Анализируем продажи и остатки..." /> : null}
        {error ? <ErrorState text={error} onRetry={loadData} /> : null}

        {!loading && !error && !filteredItems.length ? (
          <EmptyState
            title="Рекомендации не найдены"
            text="По выбранному отделу и типу рекомендаций данных пока нет."
          />
        ) : null}

        {!loading && !error && !!filteredItems.length ? (
          <div className="section-stack">
            {filteredItems.map((item) => (
              <ListCard
                key={item.variant_id}
                eyebrow="рекомендация"
                title={item.product_name}
                subtitle={`${item.product_sku} · ${item.full_sku}`}
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
                    label={recommendationTypeLabel(
                      item.recommendation_type,
                      item.title
                    )}
                    tone="neutral"
                  />
                  <StatusBadge
                    label={priorityLabel(item.priority)}
                    tone={priorityTone(item.priority)}
                  />
                </div>

                <div className="metric-grid-2" style={{ marginTop: 12 }}>
                  <MetricChip label="Отдел" value={translateDepartment(item.department_name)} />
                  <MetricChip label="Продажи 7д" value={item.sold_qty_7d} />
                  <MetricChip label="Остаток" value={item.current_stock} />
                  <MetricChip label="Резерв" value={item.reserved_stock} />
                </div>

                <div className="metric-grid-2" style={{ marginTop: 10 }}>
                  <MetricChip label="Safety stock" value={item.safety_stock} />
                  <MetricChip label="Lead time" value={item.lead_time_days} />
                  <MetricChip
                    label="Покрытие"
                    value={
                      item.stock_cover_days !== null && item.stock_cover_days !== undefined
                        ? `${item.stock_cover_days} дн.`
                        : "—"
                    }
                  />
                  <MetricChip
                    label="Реком. кол-во"
                    value={item.suggested_quantity}
                  />
                </div>

                <div className="metric-grid-2" style={{ marginTop: 10 }}>
                  <MetricChip label="Риск дефицита" value={item.stock_risk_score} />
                  <MetricChip label="Заказ" value={item.reorder_score} />
                  <MetricChip label="Выкладка" value={item.display_score} />
                  <MetricChip label="Slow mover" value={item.slow_mover_score} />
                </div>

                <div
                  style={{
                    marginTop: 12,
                    padding: 12,
                    borderRadius: 14,
                    border: "1px solid var(--border)",
                    background: "var(--surface-2)",
                    fontSize: 14,
                    lineHeight: 1.45,
                  }}
                >
                  {item.reason}
                </div>

                {item.recommendation_type === "replenish" ? (
                  <div style={{ marginTop: 14 }}>
                    <PrimaryButton
                      fullWidth
                      onClick={() => handleAddToReplenishment(item)}
                    >
                      {addingId === item.variant_id
                        ? "Добавляем..."
                        : "Добавить в пополнение"}
                    </PrimaryButton>
                  </div>
                ) : null}
              </ListCard>
            ))}
          </div>
        ) : null}
      </div>
    </MobileLayout>
  );
}