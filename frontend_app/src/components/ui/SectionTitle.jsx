export default function SectionTitle({ eyebrow, title, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 12 }}>
      <div>
        {eyebrow ? (
          <div
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 4,
            }}
          >
            {eyebrow}
          </div>
        ) : null}
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{title}</h2>
      </div>
      {right ? <div>{right}</div> : null}
    </div>
  );
}