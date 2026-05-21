import { apiGet } from "./client";

export function getProducts(limit = 50) {
  return apiGet(`/products?limit=${limit}`);
}