import { apiPost } from "./client";

export function acceptReceiptItem(payload) {
  return apiPost("/receipt/items", payload);
}