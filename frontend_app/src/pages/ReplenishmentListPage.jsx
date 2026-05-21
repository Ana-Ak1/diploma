import { useEffect, useState } from "react";
import MobileLayout from "../components/layout/MobileLayout";
import SectionTitle from "../components/ui/SectionTitle";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import ErrorState from "../components/ui/ErrorState";
import DepartmentSwitcher from "../components/ui/DepartmentSwitcher";
import PrimaryButton from "../components/ui/PrimaryButton";
import MetricChip from "../components/ui/MetricChip";
import ListCard from "../components/ui/ListCard";
import StatusBadge from "../components/ui/StatusBadge";
import { useDepartment } from "../context/useDepartment";
import {
  getActiveReplenishmentTask,
  updateReplenishmentItem,
} from "../api/replenishment";
import { translateDepartment } from "../utils/translateDepartment";

function statusTone(status) {
  if (status === "moved") return "success";
  if (status === "missing") return "critical";
  if (status === "picked") return "high";
  return "neutral";
}

function statusLabel(status) {
  if (status === "moved") return "вынесено";
  if (status === "missing") return "нет на складе";
  if (status === "picked") return "в работе";
  return "не начато";
}

export default function ReplenishmentListPage() {
  const { department } = useDepartment();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    if (department === "all") {
      setLoading(false);
      setTask(null);
      return;
    }

    loadData();
  }, [department]);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const data = await getActiveReplenishmentTask(department);
      setTask(data);
    } catch (err) {
      setError("Не удалось загрузить лист пополнения.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function markMoved(item) {
    try {
      setUpdatingId(item.item_id);
      await updateReplenishmentItem(item.item_id, {
        status: "moved",
        picked_qty: item.requested_qty,
        employee_name: "Сотрудник склада",
        comment: "Товар вынесен в зал",
      });
      await loadData();
    } catch (err) {
      setError("Не удалось обновить статус позиции.");
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  }

  async function markMissing(item) {
    try {
      setUpdatingId(item.item_id);
      await updateReplenishmentItem(item.item_id, {
        status: "missing",
        picked_qty: 0,
        employee_name: "Сотрудник склада",
        comment: "Товар не найден на складе",
      });
      await loadData();
    } catch (err) {
      setError("Не удалось отметить отсутствие товара.");
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <MobileLayout title="Лист пополнения">
      <div className="page-shell">
        <SectionTitle eyebrow="операции склада" title="Текущий лист пополнения" />

        <DepartmentSwitcher />

        {department === "all" ? (
          <EmptyState
            title="Выбери отдел"
            text="Для работы с листом пополнения нужно выбрать конкретный отдел."
          />
        ) : null}

        {department !== "all" && loading ? (
          <LoadingState text="Загружаем лист пополнения..." />
        ) : null}

        {department !== "all" && error ? (
          <ErrorState text={error} onRetry={loadData} />
        ) : null}

        {department !== "all" && !loading && !error && !task ? (
          <EmptyState
            title="Лист пополнения пуст"
            text="Пока нет активных позиций для выбранного отдела."
          />
        ) : null}

        {department !== "all" && !loading && !error && task ? (
          <>
            <div className="card" style={{ padding: 14 }}>
              <div className="metric-grid-2">
                <MetricChip
                  label="Отдел"
                  value={translateDepartment(task.department_name)}
                />
                <MetricChip label="Статус листа" value={task.status} />
              </div>
            </div>

            <div className="section-stack">
              {task.items.map((item) => (
                <ListCard
                  key={item.item_id}
                  eyebrow="позиция пополнения"
                  title={item.product_name}
                  subtitle={`${item.product_sku} · ${item.full_sku}`}
                >
                  <div
                    style={{
                      marginTop: 12,
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <StatusBadge
                      label={statusLabel(item.status)}
                      tone={statusTone(item.status)}
                    />
                  </div>

                  <div className="metric-grid-2" style={{ marginTop: 12 }}>
                    <MetricChip label="Остаток" value={item.current_stock} />
                    <MetricChip
                      label="Нужно вынести"
                      value={item.requested_qty}
                    />
                    <MetricChip label="Взято" value={item.picked_qty} />
                    <MetricChip label="Источник" value={item.source} />
                  </div>

                  <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
                    {item.status === "picked" ? (
                      <>
                        <PrimaryButton fullWidth onClick={() => markMoved(item)}>
                          {updatingId === item.item_id
                            ? "Обновляем..."
                            : "Вынесено"}
                        </PrimaryButton>

                        <PrimaryButton
                          fullWidth
                          variant="light"
                          onClick={() => markMissing(item)}
                        >
                          {updatingId === item.item_id
                            ? "Обновляем..."
                            : "Нет на складе"}
                        </PrimaryButton>
                      </>
                    ) : null}
                  </div>
                </ListCard>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </MobileLayout>
  );
}