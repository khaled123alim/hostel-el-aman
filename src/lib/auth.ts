import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

const SESSION_COOKIE = "sh_session";
const SESSION_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "insecure-dev-secret-change-me"
);
export const SESSION_HOURS = Number(process.env.AUTH_SESSION_HOURS ?? 168);

export interface SessionPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
}

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 12);
}

export function verifyPassword(plain: string, hash: string): boolean {
  try {
    return bcrypt.compareSync(plain, hash);
  } catch {
    return false;
  }
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(SESSION_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function setSession(payload: SessionPayload) {
  const token = await createSessionToken(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return await verifySessionToken(token);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  try {
    return await prisma.user.findUnique({
      where: { id: session.sub },
      include: { role: { include: { permissions: true } } },
    });
  } catch {
    return null;
  }
}

export async function requireAuth(cb?: string) {
  const session = await getSession();
  if (!session) redirect(cb ?? "/login");
  const user = await getCurrentUser();
  if (!user || user.status === "DISABLED") redirect(cb ?? "/login");
  return { session, user };
}

export async function requireAdmin(cb?: string) {
  const session = await getSession();
  if (!session) redirect("/login");
  const user = await getCurrentUser();
  if (!user || user.status === "DISABLED") redirect("/login");
  if (user.role.name === "CUSTOMER") redirect(cb ?? "/");
  return { session, user };
}

export async function getSessionOrNull() {
  try {
    return await getSession();
  } catch {
    return null;
  }
}

export function generateToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function hashToken(token: string): string {
  return bcrypt.hashSync(token, 10);
}