import { apiGet } from "./client";

export function getRecommendations(params = {}) {
  const search = new URLSearchParams();

  if (params.limit) search.set("limit", params.limit);
  if (params.priority) search.set("priority", params.priority);
  if (params.status) search.set("status", params.status);
  if (params.recommendation_type) search.set("recommendation_type", params.recommendation_type);

  const query = search.toString();
  return apiGet(`/recommendations${query ? `?${query}` : ""}`);
}