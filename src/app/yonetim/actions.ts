"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import type { FormState } from "@/lib/format";

const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(200),
});

export async function loginAction(_state: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "E-posta adresi ve parola zorunludur." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    await writeAudit({ actorId: null, tenantId: null, action: "auth.login", targetType: "session", result: "failure" });
    return { error: "E-posta adresi veya parola hatalı." };
  }

  const admin = await getAdminUser();
  if (!admin) {
    await supabase.auth.signOut();
    await writeAudit({ actorId: data.user.id, tenantId: null, action: "auth.login", targetType: "session", result: "denied" });
    return { error: "Bu hesap için yönetim paneli yetkisi tanımlanmamıştır." };
  }

  await writeAudit({ actorId: admin.id, tenantId: admin.tenantId, action: "auth.login", targetType: "session", result: "success" });
  redirect("/yonetim");
}

export async function logoutAction(): Promise<void> {
  const admin = await getAdminUser();
  const supabase = await createClient();
  await supabase.auth.signOut();
  if (admin) {
    await writeAudit({ actorId: admin.id, tenantId: admin.tenantId, action: "auth.logout", targetType: "session", result: "success" });
  }
  redirect("/yonetim/giris");
}
