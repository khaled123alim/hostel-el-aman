import { getSession, getCurrentUser } from "@/lib/auth";

export interface ApiAdminUser {
  userId: string;
  roleName: string;
  email: string;
  name: string;
}

/**
 * Staff-only guard for API routes. Returns the acting user for staff roles,
 * or null when unauthenticated / disabled / non-staff.
 */
export async function requireApiAdmin(): Promise<ApiAdminUser | null> {
  const session = await getSession();
  if (!session) return null;
  const user = await getCurrentUser();
  if (!user || user.status === "DISABLED" || user.role.name === "CUSTOMER") return null;
  return {
    userId: user.id,
    roleName: user.role.name,
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
  };
}