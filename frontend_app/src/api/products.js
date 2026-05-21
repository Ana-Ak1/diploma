import { apiGet } from "./client";

export function searchProducts(q, limit = 30) {
  const search = new URLSearchParams({ q, limit: String(limit) });
  return apiGet(`/products/search?${search.toString()}`);
}