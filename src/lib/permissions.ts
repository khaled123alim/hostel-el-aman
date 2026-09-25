import type { Role } from "@prisma/client";

export type RoleName = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "RECEPTIONIST" | "CUSTOMER";

const ROLE_PRIORITY: Record<RoleName, number> = {
  SUPER_ADMIN: 5,
  ADMIN: 4,
  MANAGER: 3,
  RECEPTIONIST: 2,
  CUSTOMER: 1,
};

/**
 * Named capabilities used across the app. Modules check these via `can()`.
 */
export const PERMISSIONS = {
  dashboard: "dashboard.view",
  reservations: {
    view: "reservations.view",
    create: "reservations.create",
    edit: "reservations.edit",
    cancel: "reservations.cancel",
    checkin: "reservations.checkin",
    checkout: "reservations.checkout",
    refund: "reservations.refund",
    delete: "reservations.delete",
    export: "reservations.export",
  },
  hostels: { view: "hostels.view", manage: "hostels.manage" },
  rooms: { view: "rooms.view", manage: "rooms.manage" },
  availability: "availability.manage",
  customers: { view: "customers.view", edit: "customers.edit" },
  payments: { view: "payments.view", manage: "payments.manage" },
  reviews: { view: "reviews.view", moderate: "reviews.moderate" },
  offers: { view: "offers.view", manage: "offers.manage" },
  reports: "reports.view",
  staff: "staff.manage",
  settings: "settings.manage",
  notifications: "notifications.manage",
  audit: "audit.view",
  housekeeping: "housekeeping.manage",
  calendar: "calendar.view",
};

const ROLE_CAPABILITIES: Record<RoleName, string[]> = {
  SUPER_ADMIN: ["*"],
  ADMIN: [
    "dashboard.view",
    "reservations.view",
    "reservations.create",
    "reservations.edit",
    "reservations.cancel",
    "reservations.checkin",
    "reservations.checkout",
    "reservations.refund",
    "reservations.delete",
    "reservations.export",
    "hostels.view",
    "hostels.manage",
    "rooms.view",
    "rooms.manage",
    "availability.manage",
    "customers.view",
    "customers.edit",
    "payments.view",
    "payments.manage",
    "reviews.view",
    "reviews.moderate",
    "offers.view",
    "offers.manage",
    "reports.view",
    "staff.manage",
    "settings.manage",
    "notifications.manage",
    "audit.view",
    "housekeeping.manage",
    "calendar.view",
  ],
  MANAGER: [
    "dashboard.view",
    "reservations.view",
    "reservations.create",
    "reservations.edit",
    "reservations.cancel",
    "reservations.checkin",
    "reservations.checkout",
    "reservations.refund",
    "reservations.export",
    "hostels.view",
    "rooms.view",
    "rooms.manage",
    "availability.manage",
    "customers.view",
    "customers.edit",
    "payments.view",
    "reviews.view",
    "reviews.moderate",
    "offers.view",
    "reports.view",
    "calendar.view",
    "housekeeping.manage",
  ],
  RECEPTIONIST: [
    "dashboard.view",
    "reservations.view",
    "reservations.create",
    "reservations.edit",
    "reservations.checkin",
    "reservations.checkout",
    "calendar.view",
    "customers.view",
    "payments.view",
    "reviews.view",
    "housekeeping.manage",
  ],
  CUSTOMER: [],
};

export function rolePriority(role: RoleName): number {
  return ROLE_PRIORITY[role] ?? 0;
}

export function can(role: RoleName, permission: string): boolean {
  const caps = ROLE_CAPABILITIES[role] ?? [];
  if (caps.includes("*")) return true;
  return caps.includes(permission);
}

export function roleHasSome(role: RoleName, permissions: string[]): boolean {
  return permissions.some((p) => can(role, p));
}

export function isStaffRole(roleName: string): boolean {
  return roleName !== "CUSTOMER";
}

export function staffRolesList(): RoleName[] {
  return ["SUPER_ADMIN", "ADMIN", "MANAGER", "RECEPTIONIST"];
}

export function permissionsForRole(role: RoleName): string[] {
  return ROLE_CAPABILITIES[role] ?? [];
}

export function roleLabel(role?: Pick<Role, "name"> | null): string {
  if (!role) return "—";
  const map: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    ADMIN: "Administrator",
    MANAGER: "Manager",
    RECEPTIONIST: "Receptionist",
    CUSTOMER: "Customer",
  };
  return map[role.name] ?? role.name;
}