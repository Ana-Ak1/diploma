import { apiGet } from "./client";

export function getSalesReport({
  period = "day",
  department = "all",
  subdepartment = "all",
  onlyInStock = true,
  limit = 100,
}) {
  const params = new URLSearchParams();

  params.set("period", period);
  params.set("only_in_stock", String(onlyInStock));
  params.set("limit", String(limit));

  if (department && department !== "all") {
    params.set("department", department);
  }

  if (subdepartment && subdepartment !== "all") {
    params.set("subdepartment", subdepartment);
  }

  return apiGet(`/sales/report?${params.toString()}`);
}