import { NextResponse } from "next/server";
import { authenticateRegistration } from "@/lib/storage";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as { referenceCode?: string; password?: string };
  const referenceCode = (body.referenceCode || "").trim().toUpperCase();
  const password = body.password || "";

  if (!referenceCode || !password) return jsonError("Reference code and password are required.", 422);

  const registration = await authenticateRegistration(referenceCode, password);
  if (!registration) return jsonError("Reference code or password is incorrect.", 401);

  return NextResponse.json({ registration });
}
