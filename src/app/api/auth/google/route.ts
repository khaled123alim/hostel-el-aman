import { NextResponse, type NextRequest } from "next/server";
import { getProviderConfig } from "@/lib/oauth";

export const runtime = "nodejs";

/**
 * Google OAuth start. If OAuth keys are not configured, the login page
 * shows the button as unavailable and this route returns a helpful error.
 */
export async function GET(req: NextRequest) {
  const config = await getProviderConfig("google");
  if (!config) {
    return NextResponse.redirect(
      new URL("/login?oauth=unavailable", req.nextUrl)
    );
  }
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  });
  const state = req.nextUrl.searchParams.get("callbackUrl") ?? "/account";
  params.set("state", Buffer.from(state).toString("base64url"));
  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
}