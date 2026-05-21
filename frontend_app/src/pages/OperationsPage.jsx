import { useNavigate } from "react-router-dom";
import {
  PackageSearch,
  ClipboardList,
  ChartColumn,
  Truck,
  History,
} from "lucide-react";
import MobileLayout from "../components/layout/MobileLayout";
import SectionTitle from "../components/ui/SectionTitle";
import ListCard from "../components/ui/ListCard";
import DepartmentSwitcher from "../components/ui/DepartmentSwitcher";

const operations = [
  {
    title: "Пополнение зала",
    subtitle: "Поиск товара, подбор вариантов и добавление в лист пополнения.",
    icon: PackageSearch,
    path: "/replenishment",
  },
  {
    title: "Лист пополнения",
    subtitle: "Текущие позиции в работе: вынесено, нет на складе и статус выполнения.",
    icon: ClipboardList,
    path: "/replenishment-list",
  },
  {
    title: "Отчет по продажам",
    subtitle: "Проданные варианты за период и быстрое добавление в пополнение.",
    icon: ChartColumn,
    path: "/sales-report",
  },
  {
    title: "Приемка поставки",
    subtitle: "Прием товара на склад и обновление остатков.",
    icon: Truck,
    path: "/receipt",
  },
  {
    title: "Журнал операций",
    subtitle: "История действий сотрудников: пополнение, приемка и служебные операции.",
    icon: History,
    path: "/operations-log",
  },
];

export default function OperationsPage() {
  const navigate = useNavigate();

  return (
    <MobileLayout title="Работа">
      <div className="page-shell">
        <SectionTitle
          eyebrow="операционный контур"
          title="Складские функции"
        />

        <DepartmentSwitcher />

        <div className="section-stack">
          {operations.map((item) => {
            const Icon = item.icon;

            return (
              <ListCard
                key={item.path}
                eyebrow="операция"
                title={item.title}
                subtitle={item.subtitle}
                onClick={() => navigate(item.path)}
              >
                <div
                  style={{
                    marginTop: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 16,
                      display: "grid",
                      placeItems: "center",
                      border: "1px solid var(--border)",
                      background: "var(--surface-2)",
                    }}
                  >
                    <Icon size={18} />
                  </div>

                  <div style={{ fontSize: 13, fontWeight: 700 }}>
                    Открыть →
                  </div>
                </div>
              </ListCard>
            );
          })}
        </div>
      </div>
    </MobileLayout>
  );
}