import ListCard from "../ui/ListCard";
import MetricChip from "../ui/MetricChip";

export default function ForecastList({ items }) {
  if (!items?.length) {
    return (
      <div className="card" style={{ padding: 16 }}>
        <div style={{ color: "var(--text-muted)" }}>Прогнозы пока отсутствуют.</div>
      </div>
    );
  }

  return (
    <div className="section-stack">
      {items.map((item) => (
        <ListCard
          key={item.id ?? item.target_date}
          eyebrow="прогноз"
          title={new Date(item.target_date).toLocaleDateString("ru-RU")}
          subtitle={`Ожидаемый спрос: ${item.predicted_demand}`}
        >
          <div className="metric-grid-2">
            <MetricChip label="Горизонт" value={item.horizon_days} />
            <MetricChip label="Нижняя граница" value={item.lower_bound ?? "—"} />
            <MetricChip label="Верхняя граница" value={item.upper_bound ?? "—"} />
            <MetricChip label="Точность" value={item.confidence ?? "—"} />
          </div>
        </ListCard>
      ))}
    </div>
  );
}