import { apiGet } from "./client";

export function getVariants(limit = 100) {
  return apiGet(`/variants?limit=${limit}`);
}

export function getLowStockVariants(limit = 100) {
  return apiGet(`/variants/low-stock?limit=${limit}`);
}