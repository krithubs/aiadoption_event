import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isValidSessionCookie } from "./security";

export const SESSION_COOKIE = "cmd_event_admin";

export async function requireAdmin(): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(SESSION_COOKIE)?.value;
  if (!isValidSessionCookie(cookieValue)) {
    return NextResponse.json({ error: "Admin login required." }, { status: 401 });
  }
  return null;
}

export function jsonError(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}
