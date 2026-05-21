import { useMemo, useState } from "react";
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
import { acceptReceiptItem } from "../api/receipt";

export default function ReceiptPage() {
  const { department, subdepartment } = useDepartment();

  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [acceptingId, setAcceptingId] = useState(null);
  const [qtyByVariant, setQtyByVariant] = useState({});

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
      setError("Не удалось выполнить поиск товаров.");
      setItems([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(item) {
    try {
      const qty = Number(qtyByVariant[item.variant_id] || 0);

      if (!qty || qty < 1) {
        setError("Укажи количество для приемки.");
        return;
      }

      setAcceptingId(item.variant_id);
      setError("");
      setSuccessMessage("");

      const resolvedDepartment =
        department === "all"
          ? translateDepartment(item.department_name)
          : department;

      const result = await acceptReceiptItem({
        department_name: resolvedDepartment,
        variant_id: item.variant_id,
        accepted_qty: qty,
        employee_name: "Сотрудник склада",
        comment: "Приемка поставки из экрана приемки",
      });

      setSuccessMessage(
        `Принято на склад: ${result.product_name}, количество ${result.accepted_qty}`
      );

      setItems((prev) =>
        prev.map((row) =>
          row.variant_id === item.variant_id
            ? { ...row, current_stock: result.current_stock }
            : row
        )
      );

      setQtyByVariant((prev) => ({
        ...prev,
        [item.variant_id]: "",
      }));
    } catch (err) {
      console.error(err);
      setError("Не удалось принять товар на склад.");
    } finally {
      setAcceptingId(null);
    }
  }

  const visibleItems = useMemo(() => {
    return items.filter((item) =>
      matchesDepartment(item.department_name, department, subdepartment)
    );
  }, [items, department, subdepartment]);

  return (
    <MobileLayout title="Приемка">
      <div className="page-shell">
        <SectionTitle eyebrow="операции склада" title="Приемка поставки" />

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
            text="Введи SKU, штрихкод или название, чтобы принять товар на склад."
          />
        ) : null}

        {!loading && searched && !error && !visibleItems.length ? (
          <EmptyState
            title="Ничего не найдено"
            text="По выбранному отделу и запросу подходящие варианты отсутствуют."
          />
        ) : null}

        {!loading && !error && !!visibleItems.length ? (
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
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      marginBottom: 8,
                      color: "var(--text-muted)",
                    }}
                  >
                    Количество к приемке
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={qtyByVariant[item.variant_id] ?? ""}
                    onChange={(e) =>
                      setQtyByVariant((prev) => ({
                        ...prev,
                        [item.variant_id]: e.target.value,
                      }))
                    }
                    placeholder="Например, 5"
                    style={{
                      width: "100%",
                      minHeight: 44,
                      borderRadius: 14,
                      border: "1px solid var(--border)",
                      background: "var(--surface)",
                      color: "var(--text)",
                      padding: "0 12px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ marginTop: 14 }}>
                  <PrimaryButton fullWidth onClick={() => handleAccept(item)}>
                    {acceptingId === item.variant_id
                      ? "Принимаем..."
                      : "Принять на склад"}
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