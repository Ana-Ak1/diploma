import { translateDepartment } from "../../utils/translateDepartment";
import StatusBadge from "../ui/StatusBadge";

export default function VariantHeroCard({ data }) {
  const stockTone =
    data.current_stock <= 0
      ? "critical"
      : data.current_stock <= data.safety_stock
      ? "high"
      : "success";

  const stockLabel =
    data.current_stock <= 0
      ? "нет в наличии"
      : data.current_stock <= data.safety_stock
      ? "низкий остаток"
      : "в наличии";

  return (
    <div className="hero-card">
      <div className="hero-card__eyebrow">профиль варианта</div>

      <div className="hero-card__title">{data.product_name}</div>

      <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
        <Tag>{data.product_sku}</Tag>
        <Tag>{data.full_sku}</Tag>
        {data.barcode ? <Tag>{data.barcode}</Tag> : null}
      </div>

      <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <StatusBadge label={translateDepartment(data.department_name)} tone="neutral" />
        <StatusBadge label={stockLabel} tone={stockTone} />
      </div>

      <div className="metric-grid-2" style={{ marginTop: 16 }}>
        <Metric label="Текущий остаток" value={data.current_stock} />
        <Metric label="Резерв" value={data.reserved_stock} />
        <Metric label="Мин. остаток" value={data.min_stock_level} />
        <Metric label="Страховой запас" value={data.safety_stock} />
      </div>
    </div>
  );
}

function Tag({ children }) {
  return (
    <div
      style={{
        fontSize: 12,
        border: "1px solid rgba(255,255,255,0.18)",
        borderRadius: 999,
        padding: "7px 10px",
        background: "rgba(255,255,255,0.08)",
      }}
    >
      {children}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 18,
        padding: 12,
      }}
    >
      <div style={{ fontSize: 11, opacity: 0.72, textTransform: "uppercase" }}>{label}</div>
      <div style={{ marginTop: 6, fontSize: 22, fontWeight: 800 }}>{value}</div>
    </div>
  );
}