import { NextResponse, type NextRequest } from "next/server";
import { getProviderConfig } from "@/lib/oauth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const provider = "google";
  const cfg = await getProviderConfig(provider);
  if (!cfg || !cfg.clientId || !cfg.clientSecret) {
    return NextResponse.redirect(new URL("/login?oauth=unavailable", req.nextUrl));
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const callbackUrl =
    (state && decodeURIComponent(Buffer.from(state, "base64url").toString())) || "/account";

  if (!code) {
    return NextResponse.redirect(new URL("/login?oauth=error", req.nextUrl));
  }

  // provider is fixed to "google" for this route
  void provider;

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        redirect_uri: cfg.redirectUri,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) throw new Error("token exchange failed");
    const { access_token } = (await tokenRes.json()) as { access_token?: string };
    if (!access_token) throw new Error("no access token");

    const profileRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    if (!profileRes.ok) throw new Error("profile fetch failed");
    const profile = (await profileRes.json()) as {
      id?: string;
      email?: string;
      given_name?: string;
      family_name?: string;
      verified_email?: boolean;
    };
    if (!profile.email) throw new Error("no email");

    // Reuse via verify route so only one code path creates sessions.
    const verify = await fetch(
      new URL("/api/auth/oauth/verify", req.nextUrl.origin),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "google",
          providerId: `google:${profile.id}`,
          email: profile.email,
          firstName: profile.given_name ?? "",
          lastName: profile.family_name ?? "",
        }),
      }
    );
    const body = (await verify.json()) as { error?: string };
    if (!verify.ok || body.error) {
      const url = new URL("/login", req.nextUrl);
      url.searchParams.set("oauth", "error");
      return NextResponse.redirect(url);
    }

    const dest = new URL(callbackUrl, req.nextUrl);
    return NextResponse.redirect(dest);
  } catch {
    const url = new URL("/login", req.nextUrl);
    url.searchParams.set("oauth", "error");
    return NextResponse.redirect(url);
  }
}