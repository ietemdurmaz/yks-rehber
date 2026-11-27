import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { profileRow, toAdminUser, type AdminUser } from "@/lib/models";

export async function getAdminUser(): Promise<AdminUser | null> {
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, tenant_id, full_name, role, is_active")
    .eq("id", auth.user.id)
    .maybeSingle();
  if (error) return null;

  const parsed = profileRow.safeParse(data);
  if (!parsed.success || !parsed.data.is_active) return null;
  return toAdminUser(parsed.data);
}

export async function requireAdminUser(): Promise<AdminUser> {
  const user = await getAdminUser();
  if (!user) redirect("/yonetim/giris");
  return user;
}

export function canAccessTenant(user: AdminUser, tenantId: string): boolean {
  if (user.role === "super_admin") return true;
  return user.tenantId !== null && user.tenantId === tenantId;
}
