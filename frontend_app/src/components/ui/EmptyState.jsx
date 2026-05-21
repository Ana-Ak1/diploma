export default function EmptyState({
  title = "Данных пока нет",
  text = "Здесь пока ничего не найдено.",
}) {
  return (
    <div className="card empty-state">
      <div className="empty-state__title">{title}</div>
      <div className="empty-state__text">{text}</div>
    </div>
  );
}