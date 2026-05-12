import type { RegistrationInput, RegistrationStatus } from "./types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\d{9,15}$/;
const TICKET_TYPES = new Set(["General", "VIP", "Speaker", "Sponsor", "Staff"]);
const STATUSES: RegistrationStatus[] = ["submitted", "reviewing", "approved"];

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: Record<string, string> };

function clean(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export function registrationInputFromFormData(formData: FormData): RegistrationInput {
  return {
    fullName: clean(formData.get("fullName")),
    email: clean(formData.get("email")).toLowerCase(),
    phone: clean(formData.get("phone")),
    organization: clean(formData.get("organization")),
    jobTitle: clean(formData.get("jobTitle")),
    ticketType: clean(formData.get("ticketType")) || "General",
    dietaryNeeds: clean(formData.get("dietaryNeeds")),
    accessibilityNeeds: clean(formData.get("accessibilityNeeds")),
    notes: clean(formData.get("notes")),
    password: clean(formData.get("password")),
  };
}

export function validateRegistrationInput(input: RegistrationInput): ValidationResult<RegistrationInput> {
  const errors: Record<string, string> = {};

  if (input.fullName.length < 2) errors.fullName = "Enter the attendee full name.";
  if (input.fullName.length > 80) errors.fullName = "Full name must be 80 characters or less.";
  if (!EMAIL_RE.test(input.email)) errors.email = "Enter a valid email address, for example name@example.com.";
  if (!PHONE_RE.test(input.phone)) errors.phone = "Phone must contain numbers only, 9 to 15 digits.";
  if (input.organization.length < 2) errors.organization = "Enter the attendee organization.";
  if (input.organization.length > 100) errors.organization = "Organization must be 100 characters or less.";
  if (input.jobTitle.length < 2) errors.jobTitle = "Enter the attendee job title.";
  if (input.jobTitle.length > 80) errors.jobTitle = "Job title must be 80 characters or less.";
  if (!TICKET_TYPES.has(input.ticketType)) errors.ticketType = "Choose a valid ticket type.";
  if (input.password.length < 8) errors.password = "Password must be at least 8 characters.";
  else if (!/[A-Za-z]/.test(input.password) || !/\d/.test(input.password)) {
    errors.password = "Password must include at least one letter and one number.";
  }
  if (input.dietaryNeeds.length > 120) errors.dietaryNeeds = "Dietary needs must be 120 characters or less.";
  if (input.accessibilityNeeds.length > 120) {
    errors.accessibilityNeeds = "Accessibility needs must be 120 characters or less.";
  }
  if (input.notes.length > 800) errors.notes = "Notes must be 800 characters or less.";

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value: input };
}

export function validateStatus(value: string | null): RegistrationStatus | null {
  return STATUSES.includes(value as RegistrationStatus) ? (value as RegistrationStatus) : null;
}

export function assertAllowedDocument(file: File): string | null {
  const maxBytes = 8 * 1024 * 1024;
  const allowed = new Set([
    "application/pdf",
    "image/png",
    "image/jpeg",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]);

  if (!file.size) return "Uploaded documents cannot be empty.";
  if (file.size > maxBytes) return "Each document must be 8 MB or smaller.";
  if (!allowed.has(file.type)) return "Documents must be PDF, PNG, JPG, or DOCX.";
  return null;
}
