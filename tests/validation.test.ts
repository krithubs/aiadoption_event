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
        fullName: "Full name is required.",
        email: "Enter a valid email address.",
        password: "Password must be at least 8 characters.",
      });
    }
  });

  it("allows only document types used by a real event review team", () => {
    expect(assertAllowedDocument(new File(["ok"], "ticket.pdf", { type: "application/pdf" }))).toBeNull();
    expect(assertAllowedDocument(new File(["no"], "script.js", { type: "application/javascript" }))).toContain(
      "PDF, PNG, JPG, or DOCX",
    );
  });
});
