import { apiGet } from "./client";

export function getOperationsLog({
  department = "all",
  subdepartment = "all",
  operationType = "all",
  period = "week",
  limit = 100,
}) {
  const params = new URLSearchParams();

  params.set("period", period);
  params.set("operation_type", operationType);
  params.set("limit", String(limit));

  if (department && department !== "all") {
    params.set("department", department);
  }

  if (subdepartment && subdepartment !== "all") {
    params.set("subdepartment", subdepartment);
  }

  return apiGet(`/operations/log?${params.toString()}`);
}