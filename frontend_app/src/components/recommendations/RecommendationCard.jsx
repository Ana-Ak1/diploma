import ListCard from "../ui/ListCard";
import MetricChip from "../ui/MetricChip";
import StatusBadge from "../ui/StatusBadge";

function getPriorityTone(priority) {
  if (priority === "critical") return "critical";
  if (priority === "high") return "high";
  if (priority === "medium") return "medium";
  return "low";
}

function translateRecommendationType(type) {
  const map = {
    replenish: "пополнить",
    hold: "удержать",
    markdown: "уценка",
    transfer: "переместить",
    investigate: "проверить",
  };

  return map[type] ?? type;
}

function translateStatus(status) {
  const map = {
    new: "новая",
    approved: "подтверждена",
    rejected: "отклонена",
    done: "выполнена",
  };

  return map[status] ?? status;
}

export default function RecommendationCard({ item }) {
  return (
    <ListCard
      eyebrow="рекомендация"
      title={translateRecommendationType(item.recommendation_type)}
      subtitle={item.reason}
    >
      <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <StatusBadge label={translateStatus(item.status)} tone="neutral" />
        <StatusBadge label={item.priority} tone={getPriorityTone(item.priority)} />
      </div>

      <div className="metric-grid-2" style={{ marginTop: 12 }}>
        <MetricChip label="Вариант" value={item.variant_id ?? "—"} />
        <MetricChip label="Количество" value={item.suggested_quantity} />
        <MetricChip
          label="Дата"
          value={new Date(item.recommendation_date).toLocaleDateString("ru-RU")}
        />
        <MetricChip label="Статус" value={translateStatus(item.status)} />
      </div>
    </ListCard>
  );
}