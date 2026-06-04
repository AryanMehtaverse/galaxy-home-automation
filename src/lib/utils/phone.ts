/**
 * Normalizes phone numbers to a consistent format for comparison:
 * 1. Removes spaces, dashes, brackets, and plus signs.
 * 2. If the number starts with "91" (country code for India) and is longer than 10 digits,
 *    removes the leading "91".
 * 3. Compares/returns the last 10 digits.
 */
export function normalizePhoneNumber(phone: string): string {
  // 1. Remove spaces, dashes, brackets, plus signs
  let cleaned = phone.replace(/[\s\-\(\)\+]/g, "");

  // 2. Normalize Indian numbers: if starts with 91 and length > 10, remove leading country code
  if (cleaned.startsWith("91") && cleaned.length > 10) {
    cleaned = cleaned.substring(2);
  }

  // Compare only the last 10 digits if it is longer than 10 digits
  if (cleaned.length > 10) {
    cleaned = cleaned.substring(cleaned.length - 10);
  }

  return cleaned;
}
