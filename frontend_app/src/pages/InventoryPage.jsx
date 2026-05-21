import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "../components/layout/MobileLayout";
import SearchBar from "../components/ui/SearchBar";
import SectionTitle from "../components/ui/SectionTitle";
import EmptyState from "../components/ui/EmptyState";
import DepartmentSwitcher from "../components/ui/DepartmentSwitcher";
import { matchesDepartment } from "../utils/departmentFilter";
import { searchProducts } from "../api/products";
import { translateDepartment } from "../utils/translateDepartment";
import { useDepartment } from "../context/useDepartment";

export default function InventoryPage() {
  const navigate = useNavigate();
  const { department, subdepartment } = useDepartment();

  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch() {
    if (!query.trim()) return;

    try {
      setLoading(true);
      setError("");

      const data = await searchProducts(query.trim(), 30);
      setItems(data);
      setSearched(true);
    } catch (err) {
      setError("Не удалось выполнить поиск.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      handleSearch();
    }
  }

  const visibleItems = useMemo(() => {
    return items.filter((item) =>
      matchesDepartment(item.department_name, department, subdepartment)
    );
  }, [items, department]);

  return (
    <MobileLayout title="Склад">
      <div className="page-shell">
        <div className="page-block">
          <SectionTitle eyebrow="каталог" title="Поиск товарных вариантов" />
        </div>

        <DepartmentSwitcher />

        <div onKeyDown={handleKeyDown}>
          <SearchBar
            value={query}
            onChange={setQuery}
            onClear={() => {
              setQuery("");
              setItems([]);
              setSearched(false);
            }}
            placeholder="SKU, штрихкод, название товара"
          />
        </div>

        <button
          type="button"
          onClick={handleSearch}
          className="primary-button"
          style={{ width: "100%" }}
        >
          Найти
        </button>

        {loading ? <div>Загрузка...</div> : null}
        {error ? <EmptyState title="Ошибка" text={error} /> : null}

        {!loading && !searched ? (
          <EmptyState
            title="Данных пока нет"
            text="Начни поиск по SKU, штрихкоду или названию товара."
          />
        ) : null}

        {!loading && searched && !visibleItems.length ? (
          <EmptyState
            title="Ничего не найдено"
            text={
              department === "all"
                ? "Попробуй другой SKU, штрихкод или часть названия."
                : `По выбранному отделу «${department}» ничего не найдено.`
            }
          />
        ) : null}

        {!loading && !!visibleItems.length ? (
          <div className="section-stack">
            {visibleItems.map((item) => (
              <button
                key={item.variant_id}
                type="button"
                onClick={() => navigate(`/variants/${item.variant_id}`)}
                className="list-card list-card--button"
              >
                <div className="list-card__eyebrow">вариант</div>

                <div className="list-card__title">{item.product_name}</div>

                <div className="list-card__subtitle">
                  {item.product_sku} · {item.full_sku}
                </div>

                <div className="metric-grid-2">
                  <Mini label="Остаток" value={item.current_stock} />
                  <Mini label="Резерв" value={item.reserved_stock} />
                  <Mini
                    label="Отдел"
                    value={translateDepartment(item.department_name)}
                  />
                  <Mini label="Страховой запас" value={item.safety_stock} />
                </div>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </MobileLayout>
  );
}

function Mini({ label, value }) {
  return (
    <div className="metric-chip">
      <div className="metric-chip__label">{label}</div>
      <div className="metric-chip__value">{value}</div>
    </div>
  );
}