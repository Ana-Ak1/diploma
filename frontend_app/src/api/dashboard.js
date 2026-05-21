import { apiGet } from "./client";

export function getDashboardSummary() {
  return apiGet("/dashboard/summary");
}