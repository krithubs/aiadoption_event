import { describe, expect, it } from "vitest";
import { assertAllowedDocument, validateRegistrationInput } from "../lib/validation";

describe("registration validation", () => {
  it("rejects invalid attendee data", () => {
    const result = validateRegistrationInput({
      fullName: "",
      email: "bad-email",
      phone: "123",
      organization: "",
      jobTitle: "",
      ticketType: "Unknown",
      dietaryNeeds: "",
      accessibilityNeeds: "",
      notes: "",
      password: "short",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toMatchObject({
        fullName: "Enter the attendee full name.",
        email: "Enter a valid email address, for example name@example.com.",
        password: "Password must be at least 8 characters.",
      });
    }
  });

  it("requires phone numbers to be digits only", () => {
    const result = validateRegistrationInput({
      fullName: "Jane Senior",
      email: "jane@example.com",
      phone: "+66 81 234 5678",
      organization: "CMD",
      jobTitle: "Reviewer",
      ticketType: "General",
      dietaryNeeds: "",
      accessibilityNeeds: "",
      notes: "",
      password: "strongpass123",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.phone).toBe("Phone must contain numbers only, 9 to 15 digits.");
    }
  });

  it("allows only document types used by a real event review team", () => {
    expect(assertAllowedDocument(new File(["ok"], "ticket.pdf", { type: "application/pdf" }))).toBeNull();
    expect(assertAllowedDocument(new File(["no"], "script.js", { type: "application/javascript" }))).toContain(
      "PDF, PNG, JPG, or DOCX",
    );
  });
});
