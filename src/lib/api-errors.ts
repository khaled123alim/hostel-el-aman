import { NextResponse } from "next/server";

export function unauthorized() {
  return NextResponse.json({ error: "errors.unauthorized" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "errors.forbidden" }, { status: 403 });
}

export function notFound() {
  return NextResponse.json({ error: "errors.notFound" }, { status: 404 });
}

export function badRequest() {
  return NextResponse.json({ error: "errors.generic" }, { status: 400 });
}

export function tooManyAttempts() {
  return NextResponse.json({ error: "errors.tooManyAttempts" }, { status: 429 });
}

export function conflict() {
  return NextResponse.json({ error: "booking.roomUnavailable" }, { status: 409 });
}