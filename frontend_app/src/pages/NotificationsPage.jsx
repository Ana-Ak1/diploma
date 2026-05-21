import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "../components/layout/MobileLayout";
import SectionTitle from "../components/ui/SectionTitle";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import ErrorState from "../components/ui/ErrorState";
import FilterChips from "../components/ui/FilterChips";
import SortSelect from "../components/ui/SortSelect";
import StatusBadge from "../components/ui/StatusBadge";
import ListCard from "../components/ui/ListCard";
import { getNotifications } from "../api/notifications";

function translateType(type) {
  const map = {
    recommendation: "рекомендация",
    risk: "риск",
    low_stock: "низкий остаток",
  };
  return map[type] ?? type;
}

function badgeTone(level) {
  if (level === "critical") return "critical";
  if (level === "high") return "high";
  if (level === "medium") return "medium";
  return "low";
}

const typeOptions = [
  { label: "Все", value: "all" },
  { label: "Риски", value: "risk" },
  { label: "Рекомендации", value: "recommendation" },
  { label: "Низкий остаток", value: "low_stock" },
];

const sortOptions = [
  { label: "Сначала важные", value: "priority_desc" },
  { label: "Сначала менее важные", value: "priority_asc" },
  { label: "По типу", value: "type" },
];

const priorityRank = { critical: 4, high: 3, medium: 2, low: 1 };

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("priority_desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const data = await getNotifications(50);
      setItems(data);
    } catch (err) {
      setError("Не удалось загрузить уведомления.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleOpen(item) {
    if (item.target_variant_id) {
      navigate(`/variants/${item.target_variant_id}`);
      return;
    }
    if (item.type === "recommendation") {
      navigate("/recommendations?priority=critical");
      return;
    }
    if (item.type === "risk") {
      navigate("/anomalies");
      return;
    }
    if (item.type === "low_stock") {
      navigate("/low-stock");
    }
  }

  const preparedItems = useMemo(() => {
    let result = [...items];

    if (typeFilter !== "all") {
      result = result.filter((item) => item.type === typeFilter);
    }

    if (sortBy === "priority_desc") {
      result.sort((a, b) => (priorityRank[b.level] ?? 0) - (priorityRank[a.level] ?? 0));
    } else if (sortBy === "priority_asc") {
      result.sort((a, b) => (priorityRank[a.level] ?? 0) - (priorityRank[b.level] ?? 0));
    } else if (sortBy === "type") {
      result.sort((a, b) => a.type.localeCompare(b.type));
    }

    return result;
  }, [items, typeFilter, sortBy]);

  return (
    <MobileLayout title="Уведомления">
      <div className="page-shell">
        <div className="page-block">
          <SectionTitle eyebrow="центр событий" title="Список уведомлений" />
        </div>

        <FilterChips value={typeFilter} onChange={setTypeFilter} options={typeOptions} />
        <SortSelect value={sortBy} onChange={setSortBy} options={sortOptions} />

        {loading ? <LoadingState text="Загружаем уведомления..." /> : null}
        {error ? <ErrorState text={error} onRetry={loadData} /> : null}

        {!loading && !error && !preparedItems.length ? (
          <EmptyState
            title="Уведомлений нет"
            text="По выбранному фильтру уведомления отсутствуют."
          />
        ) : null}

        {!loading && !error && preparedItems.length ? (
          <div className="section-stack">
            {preparedItems.map((item) => (
              <ListCard
                key={item.id}
                eyebrow={translateType(item.type)}
                title={item.title}
                subtitle={item.subtitle || ""}
                onClick={() => handleOpen(item)}
              >
                <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                  <StatusBadge label={item.level} tone={badgeTone(item.level)} />
                </div>

                <div className="inline-meta" style={{ marginTop: 12 }}>
                  {item.description}
                </div>

                <div style={{ marginTop: 14, fontSize: 13, fontWeight: 700 }}>
                  Перейти →
                </div>
              </ListCard>
            ))}
          </div>
        ) : null}
      </div>
    </MobileLayout>
  );
}