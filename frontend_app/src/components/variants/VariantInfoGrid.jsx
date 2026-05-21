import { translateDepartment } from "../../utils/translateDepartment";

export default function VariantInfoGrid({ data }) {
  const items = [
    { label: "Отдел", value: translateDepartment(data.department_name) },
    { label: "Срок поставки", value: `${data.lead_time_days} дн.` },
    { label: "Поставщик", value: data.supplier_name ?? "—" },
    { label: "Тип товара", value: data.product_type_name ?? "—" },
    { label: "Закупочная цена", value: formatMoney(data.purchase_price) },
    { label: "Цена продажи", value: formatMoney(data.sale_price) },
  ];

  return (
    <div className="grid-2">
      {items.map((item) => (
        <div key={item.label} className="card" style={{ padding: 14 }}>
          <div
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {item.label}
          </div>
          <div style={{ marginTop: 6, fontWeight: 800, lineHeight: 1.3 }}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function formatMoney(value) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 2,
  }).format(value);
}