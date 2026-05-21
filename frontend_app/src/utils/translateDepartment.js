export function translateDepartment(name) {
  if (!name) return "—";

  const normalized = String(name).trim().toLowerCase();

  if (normalized === "men") {
    return "Мужской";
  }

  if (normalized === "woman") {
    return "Женский";
  }

  if (
    normalized === "girls" ||
    normalized === "boys" ||
    normalized === "baby"
  ) {
    return "Детский";
  }

  return name;
}