import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "../components/layout/MobileLayout";
import SectionTitle from "../components/ui/SectionTitle";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import ErrorState from "../components/ui/ErrorState";
import PrimaryButton from "../components/ui/PrimaryButton";
import StatCard from "../components/ui/StatCard";
import DepartmentSwitcher from "../components/ui/DepartmentSwitcher";
import { useDepartment } from "../context/useDepartment";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { department, subdepartment } = useDepartment();

  useEffect(() => {
    loadData();
  }, [department, subdepartment]);

  async function loadData() {
    try {
      setError("");
      setData(null);

      const params = new URLSearchParams();

      if (department && department !== "all") {
        params.set("department", department);
      }

      if (subdepartment && subdepartment !== "all") {
        params.set("subdepartment", subdepartment);
      }

      const query = params.toString() ? `?${params.toString()}` : "";

      const res = await fetch(`http://127.0.0.1:8000/dashboard/summary${query}`);

      if (!res.ok) {
        throw new Error("Ошибка загрузки");
      }

      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      setError("Не удалось загрузить данные дашборда.");
    }
  }

  return (
    <MobileLayout title="Главная">
      {error ? (
        <ErrorState text={error} onRetry={loadData} />
      ) : !data ? (
        <LoadingState text="Загружаем дашборд..." />
      ) : (
        <div className="page-shell">
          <div className="hero-card">
            <div className="hero-card__eyebrow">приоритеты на сегодня</div>

            <div className="hero-card__title">
              {data.critical_recommendations} критических действий
            </div>

            <div className="hero-card__text">
              {data.low_stock_count} позиций находятся в зоне низкого остатка, активных рисков: {data.anomalies_count}.
            </div>

            <div className="hero-card__actions">
              <PrimaryButton
                onClick={() => navigate("/recommendations?priority=critical")}
                variant="light"
              >
                Критические действия
              </PrimaryButton>

              <PrimaryButton
                onClick={() => navigate("/notifications")}
                variant="ghost"
              >
                Уведомления
              </PrimaryButton>
            </div>


          </div>

          <DepartmentSwitcher />

          <SectionTitle eyebrow="сводка" title="Показатели склада" />

          <div className="grid-2">
            <StatCard
              label="Товары"
              value={data.total_products}
              onClick={() => navigate("/products")}
            />
            <StatCard
              label="Варианты"
              value={data.total_variants}
              onClick={() => navigate("/variants-list")}
            />
            <StatCard
              label="Низкий остаток"
              value={data.low_stock_count}
              accent
              onClick={() => navigate("/low-stock")}
            />
            <StatCard
              label="Риски"
              value={data.anomalies_count}
              onClick={() => navigate("/anomalies")}
            />
          </div>

          {data.total_products === 0 && data.total_variants === 0 ? (
            <EmptyState
              title="Данные не найдены"
              text="Для выбранного отдела или подотдела данные отсутствуют."
            />
          ) : null}
        </div>
      )}
    </MobileLayout>
  );
}