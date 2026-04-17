import type { TenantUser } from "@/types/multi-tenant";

export interface AppSessionUser extends TenantUser {
  image?: string | null;
}
