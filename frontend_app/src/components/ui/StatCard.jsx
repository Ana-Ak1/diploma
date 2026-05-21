export default function StatCard({ label, value, accent = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`kpi-card ${accent ? "kpi-card--accent" : ""}`}
    >
      <div className="kpi-card__label">{label}</div>
      <div className="kpi-card__value">{value}</div>
    </button>
  );
}