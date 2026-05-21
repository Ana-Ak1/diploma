import { apiGet } from "./client";

export function getAnomalies(params = {}) {
  const search = new URLSearchParams();

  if (params.limit) search.set("limit", params.limit);
  if (params.severity) search.set("severity", params.severity);
  if (params.resolved !== undefined && params.resolved !== null) {
    search.set("resolved", String(params.resolved));
  }
  if (params.anomaly_type) search.set("anomaly_type", params.anomaly_type);

  const query = search.toString();
  return apiGet(`/anomalies${query ? `?${query}` : ""}`);
}