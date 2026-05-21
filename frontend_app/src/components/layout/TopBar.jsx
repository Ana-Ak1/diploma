import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TopBar({ title }) {
  const navigate = useNavigate();

  return (
    <header className="topbar">
      <div className="topbar__row">
        <div>
          <div className="topbar__brand">MAAG Склад</div>
          <div className="topbar__title">{title}</div>
        </div>

        <button
          type="button"
          onClick={() => navigate("/notifications")}
          aria-label="Открыть уведомления"
          className="icon-button"
        >
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
}