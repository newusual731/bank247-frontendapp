import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ApiError } from "../api/client";
import { addCustomerDocument, uploadToPresignedUrl } from "../api/documents";
import {
  FigmaField,
  FigmaInput,
  FigmaSelect,
  SuccessModal,
} from "../components/figma/FigmaForm";
import { FigmaCreatePanel } from "../components/figma/FigmaHub";
import "../components/figma/FigmaForm.css";

/** Figma File Upload / customer document upload (dashed drop zone). */
export function CustomerDocumentUploadFigmaPage() {
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const [customerId, setCustomerId] = useState(id || params.get("customerId") || "");
  const [documentType, setDocumentType] = useState("PASSPORT");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit() {
    if (!customerId.trim()) {
      setError("Customer ID is required");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const created = await addCustomerDocument(customerId.trim(), {
        documentType: documentType.trim().toUpperCase(),
        referenceNumber: referenceNumber.trim() || `DOC-${Date.now()}`,
        fileName: file?.name,
        contentType: file?.type || undefined,
        signatureImage: false,
      });
      if (file && created.uploadUrl) {
        await uploadToPresignedUrl(created.uploadUrl, file, created.uploadMethod || "PUT");
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  const back = customerId.trim() ? `/customers/${customerId.trim()}` : "/customers";

  return (
    <>
      <FigmaCreatePanel
        title="File Upload"
        onClose={() => navigate(back)}
        onSubmit={() => void submit()}
        submitLabel="Upload"
        clearLabel="Close"
        busy={busy}
        error={error}
      >
        {!id ? (
          <FigmaField label="Customer ID">
            <FigmaInput
              placeholder="Enter Customer ID"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            />
          </FigmaField>
        ) : null}
        <FigmaField label="Document Type">
          <FigmaSelect value={documentType} onChange={(e) => setDocumentType(e.target.value)}>
            <option value="PASSPORT">Passport</option>
            <option value="NIN">NIN</option>
            <option value="UTILITY">Utility Bill</option>
            <option value="SIGNATURE">Signature</option>
            <option value="OTHER">Other</option>
          </FigmaSelect>
        </FigmaField>
        <FigmaField label="Reference Number">
          <FigmaInput
            placeholder="Enter reference"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
          />
        </FigmaField>
        <label className="fg-upload-drop" style={{ cursor: "pointer", display: "block" }}>
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            style={{ display: "none" }}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <div style={{ fontSize: 28, marginBottom: 8 }}>↑</div>
          {file ? file.name : "Click to upload your file here"}
          <div style={{ fontSize: 12, marginTop: 8, color: "#9ca3af" }}>PDF, JPG, PNG · Max 2MB</div>
        </label>
      </FigmaCreatePanel>
      {success ? (
        <SuccessModal
          title="Generation Successful"
          message="Document has been uploaded successfully"
          onOkay={() => navigate(back)}
        />
      ) : null}
    </>
  );
}
