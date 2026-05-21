import { createContext, useEffect, useMemo, useState } from "react";

export const DepartmentContext = createContext(null);

const STORAGE_KEY_DEPARTMENT = "maag_department";
const STORAGE_KEY_SUBDEPARTMENT = "maag_subdepartment";

export function DepartmentProvider({ children }) {
  const [department, setDepartmentState] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_DEPARTMENT) || "all";
  });

  const [subdepartment, setSubdepartmentState] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_SUBDEPARTMENT) || "all";
  });

  function setDepartment(nextDepartment) {
    setDepartmentState(nextDepartment);
    setSubdepartmentState("all");
  }

  function setSubdepartment(nextSubdepartment) {
    setSubdepartmentState(nextSubdepartment);
  }

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_DEPARTMENT, department);
  }, [department]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SUBDEPARTMENT, subdepartment);
  }, [subdepartment]);

  const value = useMemo(
    () => ({
      department,
      setDepartment,
      subdepartment,
      setSubdepartment,
    }),
    [department, subdepartment]
  );

  return (
    <DepartmentContext.Provider value={value}>
      {children}
    </DepartmentContext.Provider>
  );
}