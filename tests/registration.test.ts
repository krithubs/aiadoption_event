import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RegistrationInput } from "../lib/types";

const input: RegistrationInput = {
  fullName: "Jane Senior",
  email: "jane@example.com",
  phone: "+66 81 234 5678",
  organization: "CMD",
  jobTitle: "Engineering Lead",
  ticketType: "VIP",
  dietaryNeeds: "Vegetarian",
  accessibilityNeeds: "",
  notes: "Arrives early",
  password: "strongpass123",
};

let tempRoot = "";
const originalCwd = process.cwd();

beforeEach(async () => {
  tempRoot = await mkdtemp(path.join(tmpdir(), "cmd-event-test-"));
  process.chdir(tempRoot);
  process.env.SESSION_SECRET = "test-secret";
  vi.resetModules();
});

afterEach(async () => {
  process.chdir(originalCwd);
  await rm(tempRoot, { recursive: true, force: true });
});

describe("registration storage workflow", () => {
  it("creates a registration, protects it with a password, and supports edits", async () => {
    const storage = await import("../lib/storage");
    const file = new File(["identity"], "id.pdf", { type: "application/pdf" });
    const documents = await storage.saveUploadedDocuments([file]);

    const created = await storage.createRegistration(input, documents);

    expect(created.referenceCode).toMatch(/^CMD-\d{4}-[A-F0-9]{6}$/);
    expect(created.documents).toHaveLength(1);
    expect(await storage.authenticateRegistration(created.referenceCode, "bad-password")).toBeNull();
    expect(await storage.authenticateRegistration(created.referenceCode, input.password)).toMatchObject({
      email: "jane@example.com",
    });

    const updated = await storage.updateRegistration(
      created.referenceCode,
      input.password,
      { ...input, fullName: "Jane Updated", notes: "Changed arrival time" },
      [],
      false,
    );

    expect(updated).toMatchObject({
      fullName: "Jane Updated",
      notes: "Changed arrival time",
    });
  });

  it("updates review status for admin workflows", async () => {
    const storage = await import("../lib/storage");
    const created = await storage.createRegistration(input, []);
    const updated = await storage.updateRegistrationStatus(created.id, "approved");

    expect(updated?.status).toBe("approved");
  });
});
