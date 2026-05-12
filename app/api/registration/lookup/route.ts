import { NextResponse } from "next/server";
import { authenticateRegistration, registrationReferenceExists } from "@/lib/storage";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as { referenceCode?: string; password?: string; mode?: string };
  const referenceCode = (body.referenceCode || "").trim().toUpperCase();
  const password = body.password || "";

  if (!referenceCode) return jsonError("Reference code is required.", 422);

  if (body.mode === "reference") {
    const exists = await registrationReferenceExists(referenceCode);
    if (!exists) return jsonError("Reference code was not found.", 404);
    return NextResponse.json({ exists: true });
  }

  if (!password) return jsonError("Password is required.", 422);

  const registration = await authenticateRegistration(referenceCode, password);
  if (!registration) return jsonError("Reference code or password is incorrect.", 401);

  return NextResponse.json({ registration });
}
