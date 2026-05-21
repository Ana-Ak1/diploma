import { apiGet, apiPost } from "./client";

export function getAIRecommendationCenter({ department = "all", limit = 20 } = {}) {
  const params = new URLSearchParams();

  if (department && department !== "all") {
    params.set("department", department);
  }

  if (limit) {
    params.set("limit", String(limit));
  }

  const query = params.toString();

  return apiGet(`/ai/recommendation-center${query ? `?${query}` : ""}`);
}

export function askAIChat({
  message,
  department = "all",
  subdepartment = "all",
}) {
  return apiPost("/ai/chat", {
    message,
    department,
    subdepartment,
  });
}