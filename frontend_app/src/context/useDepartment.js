import { useContext } from "react";
import { DepartmentContext } from "./DepartmentContext";

export function useDepartment() {
  const context = useContext(DepartmentContext);

  if (!context) {
    throw new Error("useDepartment must be used inside DepartmentProvider");
  }

  return context;
}