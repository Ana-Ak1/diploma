import { apiGet } from "./client";

export function getNotifications(limit = 30) {
  return apiGet(`/notifications?limit=${limit}`);
}