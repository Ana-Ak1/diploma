import ListCard from "../ui/ListCard";
import MetricChip from "../ui/MetricChip";
import StatusBadge from "../ui/StatusBadge";

function getSeverityTone(severity) {
  if (severity === "critical") return "critical";
  if (severity === "high") return "high";
  if (severity === "medium") return "medium";
  return "low";
}

function translateRiskType(type) {
  const map = {
    sales_spike: "всплеск продаж",
    stock_mismatch: "расхождение остатков",
    negative_stock: "отрицательный остаток",
    suspicious_writeoff: "подозрительное списание",
    forecast_error: "ошибка прогноза",
  };

  return map[type] ?? type;
}

export default function AnomalyCard({ item }) {
  return (
    <ListCard
      eyebrow="риск"
      title={translateRiskType(item.anomaly_type)}
      subtitle={item.description}
    >
      <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <StatusBadge label={item.resolved ? "решен" : "активен"} tone={item.resolved ? "success" : "neutral"} />
        <StatusBadge label={item.severity} tone={getSeverityTone(item.severity)} />
      </div>

      <div className="metric-grid-2" style={{ marginTop: 12 }}>
        <MetricChip label="Вариант" value={item.variant_id ?? "—"} />
        <MetricChip
          label="Дата"
          value={new Date(item.detected_at).toLocaleDateString("ru-RU")}
        />
        <MetricChip label="Отклонение" value={item.deviation_percent ?? "—"} />
        <MetricChip label="Статус" value={item.resolved ? "решен" : "активен"} />
      </div>
    </ListCard>
  );
}