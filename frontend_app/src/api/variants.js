import { apiGet } from "./client";

export function getVariantDetails(id) {
  return apiGet(`/variants/${id}`);
}

export function getVariantForecast(id, limit = 7) {
  return apiGet(`/variants/${id}/forecast?limit=${limit}`);
}

export function getVariantRecommendations(id, limit = 10) {
  return apiGet(`/variants/${id}/recommendations?limit=${limit}`);
}

export function getVariantAnomalies(id, limit = 10) {
  return apiGet(`/variants/${id}/anomalies?limit=${limit}`);
}