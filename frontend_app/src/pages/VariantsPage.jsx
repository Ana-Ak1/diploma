import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MobileLayout from "../components/layout/MobileLayout";
import SectionTitle from "../components/ui/SectionTitle";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import ErrorState from "../components/ui/ErrorState";
import SearchBar from "../components/ui/SearchBar";
import SortSelect from "../components/ui/SortSelect";
import PrimaryButton from "../components/ui/PrimaryButton";
import MetricChip from "../components/ui/MetricChip";
import ListCard from "../components/ui/ListCard";
import { getVariants } from "../api/variantsList";
import { translateDepartment } from "../utils/translateDepartment";
import DepartmentSwitcher from "../components/ui/DepartmentSwitcher";
import { matchesDepartment } from "../utils/departmentFilter";
import { useDepartment } from "../context/useDepartment";

const sortOptions = [
  { label: "По названию", value: "name" },
  { label: "По остатку выше", value: "stock_desc" },
  { label: "По остатку ниже", value: "stock_asc" },
  { label: "По full_sku", value: "sku" },
];

export default function VariantsPage() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { department, subdepartment } = useDepartment();

  const navigate = useNavigate();
  const location = useLocation();

  const productId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("productId");
  }, [location.search]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const data = await getVariants(200);
      setItems(data);
    } catch (err) {
      setError("Не удалось загрузить список вариантов.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const preparedItems = useMemo(() => {
    let result = productId
      ? items.filter((item) => String(item.product_id) === String(productId))
      : [...items];

    result = result.filter((item) =>
      matchesDepartment(item.department_name, department, subdepartment)
    );

    if (query.trim()) {
      const lower = query.trim().toLowerCase();
      result = result.filter(
        (item) =>
          item.product_name.toLowerCase().includes(lower) ||
          item.full_sku.toLowerCase().includes(lower) ||
          (item.product_sku ?? "").toLowerCase().includes(lower) ||
          translateDepartment(item.department_name).toLowerCase().includes(lower)
      );
    }

    if (sortBy === "name") {
      result.sort((a, b) => a.product_name.localeCompare(b.product_name));
    } else if (sortBy === "stock_desc") {
      result.sort((a, b) => b.current_stock - a.current_stock);
    } else if (sortBy === "stock_asc") {
      result.sort((a, b) => a.current_stock - b.current_stock);
    } else if (sortBy === "sku") {
      result.sort((a, b) => a.full_sku.localeCompare(b.full_sku));
    }

    return result;
  }, [items, productId, query, sortBy]);

  return (
    <MobileLayout title="Варианты">
      <div className="page-shell">
        <div className="page-block">
          <SectionTitle
            eyebrow="варианты товара"
            title={productId ? `Варианты товара #${productId}` : "Список вариантов"}
          />
        </div>

        <DepartmentSwitcher />

        <SearchBar
          value={query}
          onChange={setQuery}
          onClear={() => setQuery("")}
          placeholder="Название, SKU, full_sku, отдел"
        />

        <SortSelect value={sortBy} onChange={setSortBy} options={sortOptions} />

        {loading ? <LoadingState text="Загружаем список вариантов..." /> : null}
        {error ? <ErrorState text={error} onRetry={loadData} /> : null}

        {!loading && !error && !preparedItems.length ? (
          <EmptyState
            title="Вариантов нет"
            text={query ? "По вашему запросу варианты не найдены." : "По выбранному товару варианты не найдены."}
          />
        ) : null}

        {!loading && !error && preparedItems.length ? (
          <div className="section-stack">
            {preparedItems.map((item) => (
              <ListCard
                key={item.variant_id}
                eyebrow="вариант"
                title={item.product_name}
                subtitle={item.full_sku}
              >
                <div className="metric-grid-2">
                  <MetricChip label="Остаток" value={item.current_stock} />
                  <MetricChip label="Резерв" value={item.reserved_stock} />
                  <MetricChip label="Отдел" value={translateDepartment(item.department_name)} />
                  <MetricChip label="Страховой запас" value={item.safety_stock} />
                </div>

                <div style={{ marginTop: 14 }}>
                  <PrimaryButton fullWidth onClick={() => navigate(`/variants/${item.variant_id}`)}>
                    Открыть карточку
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