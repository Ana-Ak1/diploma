export default function LoadingState({ text = "Загрузка данных..." }) {
  return (
    <div className="card loading-state">
      <div className="loading-state__title">{text}</div>
      <div className="loading-state__text">Пожалуйста, подождите.</div>
    </div>
  );
}