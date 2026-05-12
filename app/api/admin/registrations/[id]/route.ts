import { NextResponse } from "next/server";
import { requireAdmin, jsonError } from "@/lib/http";
import { getRegistrationById, updateRegistrationStatus } from "@/lib/storage";
import { validateStatus } from "@/lib/validation";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const registration = await getRegistrationById(id);
  if (!registration) return jsonError("Registration not found.", 404);
  return NextResponse.json({ registration });
}

export async function PATCH(request: Request, { params }: Params) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = (await request.json()) as { status?: string };
  const status = validateStatus(body.status || null);
  if (!status) return jsonError("Invalid status.", 422);

  const registration = await updateRegistrationStatus(id, status);
  if (!registration) return jsonError("Registration not found.", 404);
  return NextResponse.json({ registration });
}
