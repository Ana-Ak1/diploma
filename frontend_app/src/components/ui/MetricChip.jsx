export default function MetricChip({ label, value }) {
  return (
    <div className="metric-chip">
      <div className="metric-chip__label">{label}</div>
      <div className="metric-chip__value">{value}</div>
    </div>
  );
}