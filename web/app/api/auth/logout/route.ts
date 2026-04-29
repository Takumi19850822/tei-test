import { NextResponse } from "next/server";
import { buildClearSessionCookieHeader } from "@/lib/session";

export async function POST() {
  const res = NextResponse.json({ ok: true }, { status: 200 });
  res.headers.append("Set-Cookie", buildClearSessionCookieHeader());
  return res;
}
