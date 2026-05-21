import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import MobileLayout from "../components/layout/MobileLayout";
import SectionTitle from "../components/ui/SectionTitle";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import ErrorState from "../components/ui/ErrorState";
import DepartmentSwitcher from "../components/ui/DepartmentSwitcher";
import { useDepartment } from "../context/useDepartment";
import { matchesDepartment } from "../utils/departmentFilter";
import VariantHeroCard from "../components/variants/VariantHeroCard";
import VariantInfoGrid from "../components/variants/VariantInfoGrid";
import ForecastList from "../components/variants/ForecastList";
import RecommendationCard from "../components/recommendations/RecommendationCard";
import AnomalyCard from "../components/anomalies/AnomalyCard";
import { getVariantDetails } from "../api/variants";

export default function VariantDetailsPage() {
  const { variantId } = useParams();
  const { department, subdepartment } = useDepartment();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, [variantId]);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const result = await getVariantDetails(variantId);
      setData(result);
    } catch (err) {
      setError("Не удалось загрузить карточку варианта.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const isVisibleForDepartment =
    !data || matchesDepartment(data.department_name, department, subdepartment);

  return (
    <MobileLayout title="Карточка варианта">
      <div className="page-shell">
        <div className="page-block">
          <SectionTitle eyebrow="товарный вариант" title="Детальное описание" />
        </div>

        <DepartmentSwitcher />

        {loading ? <LoadingState text="Загружаем карточку варианта..." /> : null}

        {error ? <ErrorState text={error} onRetry={loadData} /> : null}

        {!loading && !error && !data ? (
          <EmptyState
            title="Вариант не найден"
            text="Проверь идентификатор или вернись к поиску."
          />
        ) : null}

        {!loading && !error && data && !isVisibleForDepartment ? (
          <EmptyState
            title="Вариант недоступен"
            text="Этот вариант относится к другому отделу."
          />
        ) : null}

        {!loading && !error && data && isVisibleForDepartment ? (
          <>
            <VariantHeroCard data={data} />

            <div className="section-divider" />

            <div className="page-block">
              <SectionTitle eyebrow="данные по складу" title="Основная информация" />
              <VariantInfoGrid data={data} />
            </div>

            <div className="section-divider" />

            <div className="page-block">
              <SectionTitle eyebrow="планирование спроса" title="Прогноз" />
              {data.forecasts?.length ? (
                <ForecastList items={data.forecasts} />
              ) : (
                <EmptyState
                  title="Прогнозов нет"
                  text="Для этого варианта пока нет данных прогноза."
                />
              )}
            </div>

            <div className="section-divider" />

            <div className="page-block">
              <SectionTitle eyebrow="ai-слой" title="Последние рекомендации" />
              {data.recent_recommendations?.length ? (
                <div className="section-stack">
                  {data.recent_recommendations.map((item) => (
                    <RecommendationCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Рекомендаций нет"
                  text="Для этого варианта AI-рекомендации пока отсутствуют."
                />
              )}
            </div>

            <div className="section-divider" />

            <div className="page-block">
              <SectionTitle eyebrow="контроль отклонений" title="Последние риски" />
              {data.recent_anomalies?.length ? (
                <div className="section-stack">
                  {data.recent_anomalies.map((item) => (
                    <AnomalyCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Рисков нет"
                  text="Для этого варианта активные риски не найдены."
                />
              )}
            </div>
          </>
        ) : null}
      </div>
    </MobileLayout>
  );
}