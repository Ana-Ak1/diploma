import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "../components/layout/MobileLayout";
import SectionTitle from "../components/ui/SectionTitle";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import ErrorState from "../components/ui/ErrorState";
import SortSelect from "../components/ui/SortSelect";
import PrimaryButton from "../components/ui/PrimaryButton";
import MetricChip from "../components/ui/MetricChip";
import ListCard from "../components/ui/ListCard";
import { getLowStockVariants } from "../api/variantsList";
import { translateDepartment } from "../utils/translateDepartment";
import DepartmentSwitcher from "../components/ui/DepartmentSwitcher";
import { matchesDepartment } from "../utils/departmentFilter";
import { useDepartment } from "../context/useDepartment";

const sortOptions = [
  { label: "Сначала самый низкий остаток", value: "stock_asc" },
  { label: "Сначала высокий страховой запас", value: "safety_desc" },
  { label: "Сначала длинный срок поставки", value: "lead_desc" },
];

export default function LowStockPage() {
  const [items, setItems] = useState([]);
  const [sortBy, setSortBy] = useState("stock_asc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { department, subdepartment } = useDepartment();

  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const data = await getLowStockVariants(200);
      setItems(data);
    } catch (err) {
      setError("Не удалось загрузить проблемные позиции.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const preparedItems = useMemo(() => {
  const filtered = items.filter((item) =>
    matchesDepartment(item.department_name, department, subdepartment)
  );

  const result = [...filtered];

  if (sortBy === "stock_asc") {
    result.sort((a, b) => a.current_stock - b.current_stock);
  } else if (sortBy === "safety_desc") {
    result.sort((a, b) => b.safety_stock - a.safety_stock);
  } else if (sortBy === "lead_desc") {
    result.sort((a, b) => b.lead_time_days - a.lead_time_days);
  }

  return result;
}, [items, sortBy, department]);

  return (
    <MobileLayout title="Низкий остаток">
      <div className="page-shell">
        <div className="page-block">
          <SectionTitle eyebrow="контроль запасов" title="Проблемные варианты" />
        </div>

        <DepartmentSwitcher />

        <SortSelect value={sortBy} onChange={setSortBy} options={sortOptions} />

        {loading ? <LoadingState text="Загружаем проблемные позиции..." /> : null}
        {error ? <ErrorState text={error} onRetry={loadData} /> : null}

        {!loading && !error && !preparedItems.length ? (
          <EmptyState
            title="Данных нет"
            text="Сейчас нет вариантов с низким остатком."
          />
        ) : null}

        {!loading && !error && preparedItems.length ? (
          <div className="section-stack">
            {preparedItems.map((item) => (
              <ListCard
                key={item.variant_id}
                eyebrow="низкий остаток"
                title={item.product_name}
                subtitle={item.full_sku}
              >
                <div className="metric-grid-2">
                  <MetricChip label="Остаток" value={item.current_stock} />
                  <MetricChip label="Страховой запас" value={item.safety_stock} />
                  <MetricChip label="Мин. остаток" value={item.min_stock_level} />
                  <MetricChip label="Срок поставки" value={`${item.lead_time_days} дн.`} />
                </div>

                <div className="metric-grid-2" style={{ marginTop: 10 }}>
                  <MetricChip label="Отдел" value={translateDepartment(item.department_name)} />
                  <MetricChip label="Резерв" value={item.reserved_stock} />
                </div>

                <div style={{ marginTop: 14 }}>
                  <PrimaryButton fullWidth onClick={() => navigate(`/variants/${item.variant_id}`)}>
                    Открыть
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