import { apiRequest } from "./client";

export type CustomerDocument = {
  id: string;
  customerId: string;
  documentType: string;
  referenceNumber: string;
  fileName?: string;
  storageReference?: string;
  signatureImage?: boolean;
  status: string;
  createdAt?: string;
  uploadUrl?: string;
  uploadMethod?: string;
  urlExpiresAt?: string;
};

export function listCustomerDocuments(customerId: string) {
  return apiRequest<CustomerDocument[]>(
    `/api/v1/customers/${encodeURIComponent(customerId)}/documents`,
  );
}

export function addCustomerDocument(
  customerId: string,
  body: {
    documentType: string;
    referenceNumber: string;
    fileName?: string;
    contentType?: string;
    signatureImage?: boolean;
  },
) {
  return apiRequest<CustomerDocument>(
    `/api/v1/customers/${encodeURIComponent(customerId)}/documents`,
    { method: "POST", body },
  );
}

/** PUT file bytes to the presigned upload URL returned by addDocument. */
export async function uploadToPresignedUrl(uploadUrl: string, file: File, method = "PUT") {
  const res = await fetch(uploadUrl, {
    method: method.toUpperCase(),
    body: file,
    headers: { "Content-Type": file.type || "application/octet-stream" },
  });
  if (!res.ok) {
    throw new Error(`Upload failed (${res.status})`);
  }
}
