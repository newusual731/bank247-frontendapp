/** Nigerian Uniform Bank Account Number (NUBAN) — typically 10 digits. */
export const NUBAN_LENGTH = 10;

/** Demo / prefill NUBAN used across Figma forms */
export const EXAMPLE_NUBAN = "0123456789";

export const NUBAN_PLACEHOLDER = "Enter 10-digit account number";

export function isValidNuban(value: string): boolean {
  return /^\d{10}$/.test(value.trim());
}

/** Keep digits only, capped at 10 (for controlled inputs). */
export function sanitizeNubanInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, NUBAN_LENGTH);
}

/** Stable demo NUBAN from an index (e.g. table seed rows). */
export function demoNuban(index = 0): string {
  return String(1_234_567_890 + (index % 1000)).padStart(NUBAN_LENGTH, "0").slice(0, NUBAN_LENGTH);
}
