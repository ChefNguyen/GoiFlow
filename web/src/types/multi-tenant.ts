export interface TenantUser {
  id: string;
  email?: string | null;
  name?: string | null;
  activeOrganizationId?: string | null;
}

export interface TenantOrganization {
  id: string;
  name: string;
  slug: string;
}

export interface TenantMembership {
  id: string;
  organizationId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
}
