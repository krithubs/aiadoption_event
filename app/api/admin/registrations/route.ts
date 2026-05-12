import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/http";
import { listRegistrations } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const registrations = await listRegistrations();
  return NextResponse.json({ registrations });
}
