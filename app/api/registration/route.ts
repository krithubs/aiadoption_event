import { NextResponse } from "next/server";
import { createRegistration, saveUploadedDocuments, updateRegistration } from "@/lib/storage";
import { assertAllowedDocument, registrationInputFromFormData, validateRegistrationInput } from "@/lib/validation";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

function filesFromFormData(formData: FormData): File[] {
  return formData.getAll("documents").filter((item): item is File => item instanceof File && item.size > 0);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const input = registrationInputFromFormData(formData);
  const validation = validateRegistrationInput(input);
  if (!validation.ok) return NextResponse.json({ errors: validation.errors }, { status: 422 });

  const files = filesFromFormData(formData);
  if (files.length === 0) return jsonError("Choose at least one file.", 422);
  for (const file of files) {
    const fileError = assertAllowedDocument(file);
    if (fileError) return jsonError(fileError, 422);
  }

  const documents = await saveUploadedDocuments(files);
  const registration = await createRegistration(validation.value, documents);
  return NextResponse.json({ registration }, { status: 201 });
}

export async function PUT(request: Request) {
  const formData = await request.formData();
  const referenceCode = String(formData.get("referenceCode") || "").trim().toUpperCase();
  const password = String(formData.get("password") || "");
  const replaceDocuments = formData.get("documentMode") === "replace";
  const input = registrationInputFromFormData(formData);
  const validation = validateRegistrationInput(input);

  if (!referenceCode || !password) return jsonError("Reference code and password are required.", 422);
  if (!validation.ok) return NextResponse.json({ errors: validation.errors }, { status: 422 });

  const files = filesFromFormData(formData);
  for (const file of files) {
    const fileError = assertAllowedDocument(file);
    if (fileError) return jsonError(fileError, 422);
  }

  const documents = await saveUploadedDocuments(files);
  const registration = await updateRegistration(referenceCode, password, validation.value, documents, replaceDocuments);
  if (!registration) return jsonError("Reference code or password is incorrect.", 401);

  return NextResponse.json({ registration });
}
