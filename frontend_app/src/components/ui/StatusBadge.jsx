export default function StatusBadge({ label, tone = "neutral" }) {
  const styles = {
    critical: { bg: "#f7e7e2", color: "var(--danger)", border: "#e4c3b8" },
    high: { bg: "#f4ecdf", color: "#9a6420", border: "#e3d1b3" },
    medium: { bg: "var(--surface-soft)", color: "var(--text)", border: "var(--border)" },
    low: { bg: "#f4f4f4", color: "var(--text-muted)", border: "#e2e2e2" },
    success: { bg: "#e9f2ea", color: "#406144", border: "#c9ddcb" },
    neutral: { bg: "#f4f4f4", color: "var(--text-muted)", border: "#e2e2e2" },
  };

  const current = styles[tone] ?? styles.neutral;

  return (
    <div
      style={{
        background: current.bg,
        color: current.color,
        border: `1px solid ${current.border}`,
        borderRadius: 999,
        padding: "6px 10px",
        fontSize: 12,
        fontWeight: 700,
        textTransform: "uppercase",
        display: "inline-flex",
      }}
    >
      {label}
    </div>
  );
}