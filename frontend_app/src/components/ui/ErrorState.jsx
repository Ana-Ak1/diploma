import PrimaryButton from "./PrimaryButton";

export default function ErrorState({
  title = "Ошибка загрузки",
  text = "Не удалось получить данные.",
  onRetry,
}) {
  return (
    <div className="card error-state">
      <div className="error-state__title">{title}</div>
      <div className="error-state__text">{text}</div>

      {onRetry ? (
        <div style={{ marginTop: 14 }}>
          <PrimaryButton onClick={onRetry}>Повторить</PrimaryButton>
        </div>
      ) : null}
    </div>
  );
}