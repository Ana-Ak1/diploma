export default function ListCard({
  eyebrow,
  title,
  subtitle,
  children,
  onClick,
}) {
  const className = onClick ? "list-card list-card--button" : "list-card";

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {eyebrow ? <div className="list-card__eyebrow">{eyebrow}</div> : null}
        <div className="list-card__title">{title}</div>
        {subtitle ? <div className="list-card__subtitle">{subtitle}</div> : null}
        {children}
      </button>
    );
  }

  return (
    <div className={className}>
      {eyebrow ? <div className="list-card__eyebrow">{eyebrow}</div> : null}
      <div className="list-card__title">{title}</div>
      {subtitle ? <div className="list-card__subtitle">{subtitle}</div> : null}
      {children}
    </div>
  );
}