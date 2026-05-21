import { apiGet, apiPatch, apiPost } from "./client";

export function getActiveReplenishmentTask(department) {
  return apiGet(`/replenishment/active?department=${encodeURIComponent(department)}`);
}

export function addReplenishmentItem(payload) {
  return apiPost("/replenishment/items", payload);
}

export function updateReplenishmentItem(itemId, payload) {
  return apiPatch(`/replenishment/items/${itemId}`, payload);
}