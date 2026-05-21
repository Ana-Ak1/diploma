export function matchesDepartment(
  itemDepartmentName,
  selectedDepartment,
  selectedSubdepartment = "all"
) {
  if (!selectedDepartment || selectedDepartment === "all") {
    return true;
  }

  if (!itemDepartmentName) {
    return false;
  }

  const item = String(itemDepartmentName).trim().toLowerCase();
  const department = String(selectedDepartment).trim().toLowerCase();
  const subdepartment = String(selectedSubdepartment).trim().toLowerCase();

  if (department === "мужской") {
    return item === "men";
  }

  if (department === "женский") {
    return item === "woman";
  }

  if (department === "детский") {
    if (subdepartment === "all") {
      return item === "girls" || item === "boys" || item === "baby";
    }

    if (subdepartment === "девочки") {
      return item === "girls";
    }

    if (subdepartment === "мальчики") {
      return item === "boys";
    }

    if (subdepartment === "малыши") {
      return item === "baby";
    }

    return item === "girls" || item === "boys" || item === "baby";
  }

  return false;
}