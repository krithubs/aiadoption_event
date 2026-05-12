import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { makeNameTagPdf } from "../lib/pdf";
import { hashPassword, verifyPassword } from "../lib/security";
import type { PublicRegistration } from "../lib/types";

describe("security and PDF output", () => {
  it("hashes passwords and verifies only the original password", async () => {
    const hash = await hashPassword("correct-password");

    expect(hash).not.toContain("correct-password");
    expect(await verifyPassword("correct-password", hash)).toBe(true);
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("generates a valid PDF name tag", async () => {
    const registration: PublicRegistration = {
      id: "reg_1",
      referenceCode: "CMD-2026-ABC123",
      fullName: "Jane Senior",
      email: "jane@example.com",
      phone: "+66 81 234 5678",
      organization: "CMD",
      jobTitle: "Engineering Lead",
      ticketType: "VIP",
      dietaryNeeds: "",
      accessibilityNeeds: "",
      notes: "",
      status: "approved",
      documents: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const pdf = await makeNameTagPdf(registration);
    const content = pdf.toString("latin1");
    const parsed = await PDFDocument.load(pdf);

    expect(content.startsWith("%PDF-")).toBe(true);
    expect(parsed.getPageCount()).toBe(1);
    expect(parsed.getPage(0).getWidth()).toBe(560);
    expect(parsed.getPage(0).getHeight()).toBe(360);
    expect(pdf.byteLength).toBeGreaterThan(1500);
  });
});
