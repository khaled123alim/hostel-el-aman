export interface ProviderConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export async function getProviderConfig(
  provider: "google"
): Promise<ProviderConfig | null> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const prefix = provider.toUpperCase();
  const clientId = process.env[`${prefix}_CLIENT_ID`];
  const clientSecret = process.env[`${prefix}_CLIENT_SECRET`];
  if (!clientId || !clientSecret) return null;
  return {
    clientId,
    clientSecret,
    redirectUri: `${appUrl}/api/auth/${provider}/callback`,
  };
}

export async function getGoogleClientConfig() {
  const cfg = await getProviderConfig("google");
  return cfg ? { clientId: cfg.clientId, redirectUri: cfg.redirectUri } : null;
}