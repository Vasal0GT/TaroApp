import { apiRequest } from "./apiClient";

export type BillingPortalLinkResponse = {
  url: string;
  expiresAt: string;
};

export async function createBillingPortalLinkRequest() {
  return apiRequest<BillingPortalLinkResponse>("/api/billing/portal-links", {
    method: "POST",
    auth: true,
  });
}
