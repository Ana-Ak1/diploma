import { NavLink } from "react-router-dom";
import { Home, Boxes, BriefcaseBusiness, Sparkles } from "lucide-react";

const items = [
  { to: "/", label: "Главная", icon: Home },
  { to: "/inventory", label: "Склад", icon: Boxes },
  { to: "/operations", label: "Отчеты", icon: BriefcaseBusiness },
  { to: "/recommendations", label: "Анализ", icon: Sparkles },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `bottom-nav__item ${isActive ? "bottom-nav__item--active" : ""}`
          }
        >
          <Icon size={18} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}