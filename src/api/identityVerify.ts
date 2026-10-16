import { apiRequest } from "./client";

/** Profile returned by NIBSS BVN / NIN identity lookup (via Bank247 customer-service). */
export type IdentityProfile = {
  title?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  nationality?: string;
  stateOfOrigin?: string;
  lgaOfOrigin?: string;
  phoneNumber?: string;
  email?: string;
  addressLine1?: string;
  city?: string;
  stateName?: string;
  validatedAt?: string;
};

export type IdentityVerifyResponse = {
  source: "BVN" | "NIN";
  reference: string;
  profile: IdentityProfile;
};

export function verifyBvn(bvn: string) {
  return apiRequest<IdentityVerifyResponse>("/api/v1/customers/identity/bvn", {
    method: "POST",
    body: { bvn },
  });
}

export function verifyNin(nin: string) {
  return apiRequest<IdentityVerifyResponse>("/api/v1/customers/identity/nin", {
    method: "POST",
    body: { nin },
  });
}
