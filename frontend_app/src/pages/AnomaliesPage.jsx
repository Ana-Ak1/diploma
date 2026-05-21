import { useEffect, useState } from "react";
import MobileLayout from "../components/layout/MobileLayout";
import SectionTitle from "../components/ui/SectionTitle";
import FilterChips from "../components/ui/FilterChips";
import EmptyState from "../components/ui/EmptyState";
import AnomalyCard from "../components/anomalies/AnomalyCard";
import { getAnomalies } from "../api/anomalies";

const severityOptions = [
  { label: "Все", value: "all" },
  { label: "Критические", value: "critical" },
  { label: "Высокие", value: "high" },
  { label: "Средние", value: "medium" },
  { label: "Низкие", value: "low" },
];

export default function AnomaliesPage() {
  const [items, setItems] = useState([]);
  const [severity, setSeverity] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, [severity]);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const data = await getAnomalies({
        limit: 50,
        resolved: false,
        severity: severity === "all" ? undefined : severity,
      });

      setItems(data);
    } catch (err) {
      setError("Не удалось загрузить риски.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <MobileLayout title="Риски">
      <div className="section-stack">
        <SectionTitle eyebrow="контроль отклонений" title="Активные риски" />

        <FilterChips
          value={severity}
          onChange={setSeverity}
          options={severityOptions}
        />

        {loading ? <div>Загрузка...</div> : null}
        {error ? <EmptyState title="Ошибка" text={error} /> : null}

        {!loading && !error && !items.length ? (
          <EmptyState
            title="Рисков нет"
            text="По выбранному фильтру активные риски не найдены."
          />
        ) : null}

        {!loading && !error && !!items.length ? (
          <div className="section-stack">
            {items.map((item) => (
              <AnomalyCard key={item.id} item={item} />
            ))}
          </div>
        ) : null}
      </div>
    </MobileLayout>
  );
}