import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { getProducts } from "../api/productsList";
import { translateDepartment } from "../utils/translateDepartment";
import DepartmentSwitcher from "../components/ui/DepartmentSwitcher";
import { useDepartment } from "../context/useDepartment";
import { matchesDepartment } from "../utils/departmentFilter";

function formatMoney(value) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 2,
  }).format(value);
}

const sortOptions = [
  { label: "По названию", value: "name" },
  { label: "По цене выше", value: "price_desc" },
  { label: "По цене ниже", value: "price_asc" },
  { label: "По количеству вариантов", value: "variants_desc" },
];

export default function ProductsPage() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { department, subdepartment } = useDepartment();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const data = await getProducts(100);
      setItems(data);
    } catch (err) {
      setError("Не удалось загрузить список товаров.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const preparedItems = useMemo(() => {
    let result = [...items];

    if (query.trim()) {
      const lower = query.trim().toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(lower) ||
          item.sku.toLowerCase().includes(lower) ||
          (item.supplier_name ?? "").toLowerCase().includes(lower) ||
          translateDepartment(item.department_name).toLowerCase().includes(lower)
      );
    }

    result = result.filter((item) =>
      matchesDepartment(item.department_name, department, subdepartment)
    );

    if (sortBy === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "price_desc") {
      result.sort((a, b) => b.sale_price - a.sale_price);
    } else if (sortBy === "price_asc") {
      result.sort((a, b) => a.sale_price - b.sale_price);
    } else if (sortBy === "variants_desc") {
      result.sort((a, b) => b.variants_count - a.variants_count);
    }

    return result;
  }, [items, query, sortBy]);

  return (
    <MobileLayout title="Товары">
      <div className="page-shell">
        <div className="page-block">
          <SectionTitle eyebrow="каталог" title="Список товаров" />
        </div>

        <SearchBar
          value={query}
          onChange={setQuery}
          onClear={() => setQuery("")}
          placeholder="Название, SKU, поставщик, отдел"
        />

        <SortSelect value={sortBy} onChange={setSortBy} options={sortOptions} />

        {loading ? <LoadingState text="Загружаем список товаров..." /> : null}
        {error ? <ErrorState text={error} onRetry={loadData} /> : null}

        {!loading && !error && !preparedItems.length ? (
          <EmptyState
            title="Товаров нет"
            text={query ? "По вашему запросу товары не найдены." : "Список товаров пока пуст."}
          />
        ) : null}

    <DepartmentSwitcher />

        {!loading && !error && preparedItems.length ? (
          <div className="section-stack">
            {preparedItems.map((item) => (
              <ListCard
                key={item.product_id}
                eyebrow="товар"
                title={item.name}
                subtitle={`SKU: ${item.sku}`}
              >
                <div className="metric-grid-2">
                  <MetricChip label="Отдел" value={translateDepartment(item.department_name)} />
                  <MetricChip label="Поставщик" value={item.supplier_name ?? "—"} />
                  <MetricChip label="Цена" value={formatMoney(item.sale_price)} />
                  <MetricChip label="Вариантов" value={item.variants_count} />
                </div>

                <div style={{ marginTop: 14 }}>
                  <PrimaryButton fullWidth onClick={() => navigate(`/variants-list?productId=${item.product_id}`)}>
                    Открыть варианты
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