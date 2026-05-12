import { NextResponse } from "next/server";
import { makeSessionCookie } from "@/lib/security";
import { SESSION_COOKIE, jsonError } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as { username?: string; password?: string };
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin12345";

  if (body.username !== username || body.password !== password) {
    return jsonError("Invalid admin credentials.", 401);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, makeSessionCookie(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}
