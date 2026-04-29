import { NextResponse } from "next/server";

export function badRequest(message: string) {
  return NextResponse.json({ ok: false, message }, { status: 400 });
}

export function serverError(message: string, details?: string) {
  return NextResponse.json(
    {
      ok: false,
      message,
      details,
    },
    { status: 500 },
  );
}

export function conflict(message: string) {
  return NextResponse.json({ ok: false, message }, { status: 409 });
}

export function unauthorized(message: string) {
  return NextResponse.json({ ok: false, message }, { status: 401 });
}

export function forbidden(message: string) {
  return NextResponse.json({ ok: false, message }, { status: 403 });
}

export function toNumber(value: unknown, fallback = 0): number {
  const parsed =
    typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}
