import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "../components/layout/MobileLayout";
import SectionTitle from "../components/ui/SectionTitle";
import SearchBar from "../components/ui/SearchBar";
import EmptyState from "../components/ui/EmptyState";
import DepartmentSwitcher from "../components/ui/DepartmentSwitcher";
import LoadingState from "../components/ui/LoadingState";
import ErrorState from "../components/ui/ErrorState";
import PrimaryButton from "../components/ui/PrimaryButton";
import MetricChip from "../components/ui/MetricChip";
import ListCard from "../components/ui/ListCard";
import { useDepartment } from "../context/useDepartment";
import { matchesDepartment } from "../utils/departmentFilter";
import { translateDepartment } from "../utils/translateDepartment";
import { searchProducts } from "../api/products";
import {
  addReplenishmentItem,
  getActiveReplenishmentTask,
} from "../api/replenishment";

export default function ReplenishmentPage() {
  const navigate = useNavigate();
  const { department, subdepartment } = useDepartment();

  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [addingId, setAddingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [activeCount, setActiveCount] = useState(null);

  useEffect(() => {
    if (department === "all") {
      setActiveCount(null);
      return;
    }

    refreshActiveCount(department);
  }, [department]);

  async function refreshActiveCount(resolvedDepartment) {
    try {
      const task = await getActiveReplenishmentTask(resolvedDepartment);
      setActiveCount(task?.items?.length ?? 0);
    } catch (err) {
      console.error(err);
      setActiveCount(0);
    }
  }

  async function handleSearch() {
    if (!query.trim()) return;

    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      const data = await searchProducts(query.trim(), 30);
      setItems(Array.isArray(data) ? data : []);
      setSearched(true);
    } catch (err) {
      console.error(err);
      setError("Не удалось выполнить поиск вариантов.");
      setItems([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(item) {
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
        requested_qty: 1,
        source: "manual",
        created_by: "Сотрудник склада",
        comment: "Добавлено из экрана пополнения",
      });

      setSuccessMessage(`Добавлено в лист пополнения: ${item.product_name}`);
      await refreshActiveCount(resolvedDepartment);
    } catch (err) {
      console.error(err);
      setError("Не удалось добавить позицию в лист пополнения.");
    } finally {
      setAddingId(null);
    }
  }

  const visibleItems = useMemo(() => {
    return items.filter((item) =>
      matchesDepartment(item.department_name, department, subdepartment)
    );
  }, [items, department, subdepartment]);

  return (
    <MobileLayout title="Пополнение зала">
      <div className="page-shell">
        <SectionTitle eyebrow="операции склада" title="Подбор товаров в зал" />

        <DepartmentSwitcher />

        <SearchBar
          value={query}
          onChange={setQuery}
          onClear={() => {
            setQuery("");
            setItems([]);
            setSearched(false);
            setError("");
            setSuccessMessage("");
          }}
          placeholder="Штрихкод, SKU, название"
        />

        <PrimaryButton fullWidth onClick={handleSearch}>
          Найти товар
        </PrimaryButton>

        <div className="card" style={{ padding: 14 }}>
          <div className="list-card__eyebrow">Подсказка</div>
          <div className="inline-meta" style={{ marginTop: 8 }}>
            В первую очередь выноси варианты с низким остатком и высоким
            резервом.
          </div>
        </div>

        {activeCount !== null ? (
          <div className="card" style={{ padding: 14 }}>
            <div className="list-card__eyebrow">лист пополнения</div>

            <div style={{ marginTop: 6, fontWeight: 700 }}>
              {activeCount > 0
                ? `В работе: ${activeCount} поз.`
                : "Лист пополнения пуст"}
            </div>

            <div style={{ marginTop: 12 }}>
              <PrimaryButton
                fullWidth
                onClick={() => navigate("/replenishment-list")}
              >
                Открыть лист пополнения
              </PrimaryButton>
            </div>
          </div>
        ) : null}

        {successMessage ? (
          <div className="card" style={{ padding: 14 }}>
            <div style={{ fontWeight: 700 }}>{successMessage}</div>
          </div>
        ) : null}

        {loading ? <LoadingState text="Ищем варианты..." /> : null}
        {error ? <ErrorState text={error} /> : null}

        {!loading && !searched ? (
          <EmptyState
            title="Поиск не выполнен"
            text="Отсканируй товар или введи SKU / штрихкод, чтобы подобрать варианты для пополнения."
          />
        ) : null}

        {!loading && searched && !error && !visibleItems.length ? (
          <EmptyState
            title="Ничего не найдено"
            text="По выбранному отделу и запросу подходящие варианты отсутствуют."
          />
        ) : null}

        {!loading && !error && visibleItems.length ? (
          <div className="section-stack">
            {visibleItems.map((item) => (
              <ListCard
                key={item.variant_id}
                eyebrow="вариант"
                title={item.product_name}
                subtitle={`${item.product_sku} · ${item.full_sku}`}
              >
                <div className="metric-grid-2">
                  <MetricChip
                    label="Отдел"
                    value={translateDepartment(item.department_name)}
                  />
                  <MetricChip label="Остаток" value={item.current_stock} />
                  <MetricChip label="Резерв" value={item.reserved_stock} />
                  <MetricChip
                    label="Страховой запас"
                    value={item.safety_stock ?? "—"}
                  />
                </div>

                <div style={{ marginTop: 14 }}>
                  <PrimaryButton fullWidth onClick={() => handleAdd(item)}>
                    {addingId === item.variant_id
                      ? "Добавляем..."
                      : "Добавить в пополнение"}
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