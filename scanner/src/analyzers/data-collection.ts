/**
 * Data collection analyzer — identifies forms and inputs that collect personal data.
 */

const PII_FIELD_PATTERNS = [
  { pattern: /email/i, type: "email" },
  { pattern: /phone|tel|mobile/i, type: "phone" },
  { pattern: /name|first.?name|last.?name|full.?name/i, type: "name" },
  { pattern: /address|street|city|state|zip|postal/i, type: "address" },
  { pattern: /ssn|social.?security/i, type: "ssn" },
  { pattern: /dob|birth|birthday/i, type: "date_of_birth" },
  { pattern: /credit.?card|card.?number|cvv|expir/i, type: "financial" },
  { pattern: /password|passwd/i, type: "password" },
] as const;

export type PIIType = (typeof PII_FIELD_PATTERNS)[number]["type"];

export interface PIIField {
  fieldName: string;
  fieldType: string;
  piiType: PIIType;
}

export function detectPIIFields(
  fields: { name: string; type: string }[],
): PIIField[] {
  const results: PIIField[] = [];

  for (const field of fields) {
    for (const { pattern, type: piiType } of PII_FIELD_PATTERNS) {
      if (pattern.test(field.name) || (field.type === "email" && piiType === "email") || (field.type === "tel" && piiType === "phone")) {
        results.push({
          fieldName: field.name,
          fieldType: field.type,
          piiType,
        });
        break;
      }
    }
  }

  return results;
}
