import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import { randomBytes, randomUUID } from "crypto";
import { get, put } from "@vercel/blob";
import type { PublicRegistration, Registration, RegistrationInput, RegistrationStatus, SupportingDocument } from "./types";
import { hashPassword, verifyPassword } from "./security";

const runtimeRoot = process.env.VERCEL ? path.join("/tmp", "cmd-ai-event-registration") : process.cwd();
const dataDir = path.join(runtimeRoot, "data");
const uploadDir = path.join(runtimeRoot, "uploads");
const dbPath = path.join(runtimeRoot, "data", "registrations.json");
const blobDbPath = "data/registrations.json";
const useBlobStore = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

type Database = {
  registrations: Registration[];
};

let writeQueue: Promise<unknown> = Promise.resolve();

function enqueueWrite<T>(task: () => Promise<T>): Promise<T> {
  const run = writeQueue.then(task, task);
  writeQueue = run.catch(() => undefined);
  return run;
}

async function ensureStore(): Promise<void> {
  if (useBlobStore) return;
  await mkdir(dataDir, { recursive: true });
  await mkdir(uploadDir, { recursive: true });
  try {
    await readFile(dbPath, "utf8");
  } catch {
    await writeFile(dbPath, JSON.stringify({ registrations: [] }, null, 2));
  }
}

async function readDb(): Promise<Database> {
  if (useBlobStore) {
    const blob = await get(blobDbPath, { access: "private", useCache: false });
    if (!blob?.stream) return { registrations: [] };
    const raw = await new Response(blob.stream).text();
    return JSON.parse(raw) as Database;
  }

  await ensureStore();
  const raw = await readFile(dbPath, "utf8");
  return JSON.parse(raw) as Database;
}

async function writeDb(db: Database): Promise<void> {
  if (useBlobStore) {
    await put(blobDbPath, JSON.stringify(db, null, 2), {
      access: "private",
      allowOverwrite: true,
      contentType: "application/json",
    });
    return;
  }

  await ensureStore();
  const tempPath = `${dbPath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tempPath, JSON.stringify(db, null, 2));
  await rename(tempPath, dbPath);
}

function withoutPassword(registration: Registration): PublicRegistration {
  const { passwordHash: _passwordHash, ...publicRegistration } = registration;
  return publicRegistration;
}

function referenceCode(): string {
  const year = new Date().getFullYear();
  return `CMD-${year}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

function cleanFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "document";
}

export function getUploadPath(storedName: string): string {
  return path.join(uploadDir, storedName);
}

export async function readStoredDocument(storedName: string): Promise<Buffer> {
  if (useBlobStore) {
    const blob = await get(`uploads/${storedName}`, { access: "private", useCache: false });
    if (!blob?.stream) throw new Error("Document not found.");
    const bytes = await new Response(blob.stream).arrayBuffer();
    return Buffer.from(bytes);
  }

  return readFile(getUploadPath(storedName));
}

export async function saveUploadedDocuments(files: File[]): Promise<SupportingDocument[]> {
  if (!useBlobStore) {
    await mkdir(uploadDir, { recursive: true });
  }
  const saved: SupportingDocument[] = [];

  for (const file of files) {
    const id = randomUUID();
    const originalName = cleanFileName(file.name);
    const storedName = `${id}-${originalName}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    if (useBlobStore) {
      await put(`uploads/${storedName}`, bytes, {
        access: "private",
        allowOverwrite: true,
        contentType: file.type || "application/octet-stream",
      });
    } else {
      await writeFile(getUploadPath(storedName), bytes);
    }
    saved.push({
      id,
      originalName,
      storedName,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      uploadedAt: new Date().toISOString(),
    });
  }

  return saved;
}

export async function createRegistration(input: RegistrationInput, documents: SupportingDocument[]): Promise<PublicRegistration> {
  return enqueueWrite(async () => {
    const db = await readDb();
    let code = referenceCode();
    while (db.registrations.some((registration) => registration.referenceCode === code)) {
      code = referenceCode();
    }

    const now = new Date().toISOString();
    const registration: Registration = {
      id: randomUUID(),
      referenceCode: code,
      passwordHash: await hashPassword(input.password),
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      organization: input.organization,
      jobTitle: input.jobTitle,
      ticketType: input.ticketType,
      dietaryNeeds: input.dietaryNeeds,
      accessibilityNeeds: input.accessibilityNeeds,
      notes: input.notes,
      status: "submitted",
      documents,
      createdAt: now,
      updatedAt: now,
    };

    db.registrations.unshift(registration);
    await writeDb(db);
    return withoutPassword(registration);
  });
}

export async function authenticateRegistration(referenceCodeValue: string, password: string): Promise<PublicRegistration | null> {
  const db = await readDb();
  const registration = db.registrations.find((item) => item.referenceCode === referenceCodeValue.trim().toUpperCase());
  if (!registration) return null;
  return (await verifyPassword(password, registration.passwordHash)) ? withoutPassword(registration) : null;
}

export async function updateRegistration(
  referenceCodeValue: string,
  password: string,
  input: RegistrationInput,
  documents: SupportingDocument[],
  replaceDocuments: boolean,
): Promise<PublicRegistration | null> {
  return enqueueWrite(async () => {
    const db = await readDb();
    const index = db.registrations.findIndex((item) => item.referenceCode === referenceCodeValue.trim().toUpperCase());
    if (index === -1) return null;

    const existing = db.registrations[index];
    if (!(await verifyPassword(password, existing.passwordHash))) return null;

    const updated: Registration = {
      ...existing,
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      organization: input.organization,
      jobTitle: input.jobTitle,
      ticketType: input.ticketType,
      dietaryNeeds: input.dietaryNeeds,
      accessibilityNeeds: input.accessibilityNeeds,
      notes: input.notes,
      documents: replaceDocuments ? documents : [...existing.documents, ...documents],
      updatedAt: new Date().toISOString(),
    };

    db.registrations[index] = updated;
    await writeDb(db);
    return withoutPassword(updated);
  });
}

export async function listRegistrations(): Promise<PublicRegistration[]> {
  const db = await readDb();
  return db.registrations.map(withoutPassword);
}

export async function getRegistrationById(id: string): Promise<PublicRegistration | null> {
  const db = await readDb();
  const registration = db.registrations.find((item) => item.id === id);
  return registration ? withoutPassword(registration) : null;
}

export async function updateRegistrationStatus(id: string, status: RegistrationStatus): Promise<PublicRegistration | null> {
  return enqueueWrite(async () => {
    const db = await readDb();
    const index = db.registrations.findIndex((item) => item.id === id);
    if (index === -1) return null;
    db.registrations[index] = {
      ...db.registrations[index],
      status,
      updatedAt: new Date().toISOString(),
    };
    await writeDb(db);
    return withoutPassword(db.registrations[index]);
  });
}
