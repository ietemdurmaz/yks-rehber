"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { canAccessTenant, requireAdminUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { createClient } from "@/lib/supabase/server";
import { cityRow, institutionTypeSchema, parseRows, universityRow } from "@/lib/models";
import type { FormState } from "@/lib/format";

const createCitySchema = z.object({
  name: z.string().trim().min(2).max(100),
  tenantId: z.uuid().optional(),
});
const idSchema = z.object({ id: z.uuid() });
const createUniversitySchema = z.object({
  name: z.string().trim().min(2).max(200),
  type: institutionTypeSchema,
  cityId: z.uuid(),
});

const DENIED: FormState = { error: "Bu işlem için yetkiniz bulunmamaktadır." };
const INVALID: FormState = { error: "Girilen bilgiler geçersiz." };

function optional(value: FormDataEntryValue | null): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined;
}

export async function createCityAction(_s: FormState, formData: FormData): Promise<FormState> {
  const user = await requireAdminUser();
  const parsed = createCitySchema.safeParse({
    name: formData.get("name"),
    tenantId: optional(formData.get("tenantId")),
  });
  if (!parsed.success) return INVALID;

  const tenantId = user.role === "super_admin" ? parsed.data.tenantId : user.tenantId;
  if (!tenantId) return { error: "Kurum seçilmelidir." };
  if (!canAccessTenant(user, tenantId)) {
    await writeAudit({ actorId: user.id, tenantId, action: "city.create", targetType: "city", result: "denied" });
    return DENIED;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cities")
    .insert({ name: parsed.data.name, tenant_id: tenantId })
    .select("id")
    .single();
  if (error) {
    await writeAudit({ actorId: user.id, tenantId, action: "city.create", targetType: "city", result: "failure" });
    return { error: "Şehir kaydedilemedi. Aynı adlı bir kayıt bulunuyor olabilir." };
  }
  const created = idSchema.safeParse(data);
  await writeAudit({
    actorId: user.id,
    tenantId,
    action: "city.create",
    targetType: "city",
    targetId: created.success ? created.data.id : null,
    result: "success",
    changes: { name: parsed.data.name },
  });
  revalidatePath("/yonetim/sehirler");
  return { message: "Şehir kaydedildi." };
}

export async function deleteCityAction(_s: FormState, formData: FormData): Promise<FormState> {
  const user = await requireAdminUser();
  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return INVALID;

  const supabase = await createClient();
  const { data, error: readError } = await supabase.from("cities").select("id, tenant_id, name").eq("id", parsed.data.id);
  if (readError) return { error: "Kayıt okunamadı." };
  const city = parseRows(cityRow, data)[0];
  if (!city) return { error: "Kayıt bulunamadı." };

  if (!canAccessTenant(user, city.tenant_id)) {
    await writeAudit({ actorId: user.id, tenantId: city.tenant_id, action: "city.delete", targetType: "city", targetId: city.id, result: "denied" });
    return DENIED;
  }

  const { error } = await supabase.from("cities").delete().eq("id", city.id);
  if (error) {
    await writeAudit({ actorId: user.id, tenantId: city.tenant_id, action: "city.delete", targetType: "city", targetId: city.id, result: "failure" });
    return { error: "Şehir silinemedi. Bağlı üniversite veya şehir kayıtları bulunuyor olabilir." };
  }
  await writeAudit({
    actorId: user.id,
    tenantId: city.tenant_id,
    action: "city.delete",
    targetType: "city",
    targetId: city.id,
    result: "success",
    changes: { name: city.name },
  });
  revalidatePath("/yonetim/sehirler");
  return { message: "Şehir silindi." };
}

export async function createUniversityAction(_s: FormState, formData: FormData): Promise<FormState> {
  const user = await requireAdminUser();
  const parsed = createUniversitySchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    cityId: formData.get("cityId"),
  });
  if (!parsed.success) return INVALID;

  const supabase = await createClient();
  const { data, error: readError } = await supabase.from("cities").select("id, tenant_id, name").eq("id", parsed.data.cityId);
  if (readError) return { error: "Şehir okunamadı." };
  const city = parseRows(cityRow, data)[0];
  if (!city) return { error: "Şehir bulunamadı." };

  if (!canAccessTenant(user, city.tenant_id)) {
    await writeAudit({ actorId: user.id, tenantId: city.tenant_id, action: "university.create", targetType: "university", result: "denied" });
    return DENIED;
  }

  const { data: inserted, error } = await supabase
    .from("universities")
    .insert({ name: parsed.data.name, type: parsed.data.type, city_id: city.id, tenant_id: city.tenant_id })
    .select("id")
    .single();
  if (error) {
    await writeAudit({ actorId: user.id, tenantId: city.tenant_id, action: "university.create", targetType: "university", result: "failure" });
    return { error: "Üniversite kaydedilemedi." };
  }
  const created = idSchema.safeParse(inserted);
  await writeAudit({
    actorId: user.id,
    tenantId: city.tenant_id,
    action: "university.create",
    targetType: "university",
    targetId: created.success ? created.data.id : null,
    result: "success",
    changes: { name: parsed.data.name, type: parsed.data.type, city: city.name },
  });
  revalidatePath("/yonetim/universiteler");
  return { message: "Üniversite kaydedildi." };
}

export async function deleteUniversityAction(_s: FormState, formData: FormData): Promise<FormState> {
  const user = await requireAdminUser();
  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return INVALID;

  const supabase = await createClient();
  const { data, error: readError } = await supabase
    .from("universities")
    .select("id, tenant_id, city_id, name, type")
    .eq("id", parsed.data.id);
  if (readError) return { error: "Kayıt okunamadı." };
  const university = parseRows(universityRow, data)[0];
  if (!university) return { error: "Kayıt bulunamadı." };

  if (!canAccessTenant(user, university.tenant_id)) {
    await writeAudit({ actorId: user.id, tenantId: university.tenant_id, action: "university.delete", targetType: "university", targetId: university.id, result: "denied" });
    return DENIED;
  }

  const { error } = await supabase.from("universities").delete().eq("id", university.id);
  if (error) {
    await writeAudit({ actorId: user.id, tenantId: university.tenant_id, action: "university.delete", targetType: "university", targetId: university.id, result: "failure" });
    return { error: "Üniversite silinemedi. Bağlı bölüm kayıtları bulunuyor olabilir." };
  }
  await writeAudit({
    actorId: user.id,
    tenantId: university.tenant_id,
    action: "university.delete",
    targetType: "university",
    targetId: university.id,
    result: "success",
    changes: { name: university.name },
  });
  revalidatePath("/yonetim/universiteler");
  return { message: "Üniversite silindi." };
}
