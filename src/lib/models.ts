import { z } from "zod";

export const roleSchema = z.enum(["super_admin", "tenant_admin"]);
export type Role = z.infer<typeof roleSchema>;

export const profileRow = z.object({
  id: z.uuid(),
  tenant_id: z.uuid().nullable(),
  full_name: z.string(),
  role: roleSchema,
  is_active: z.boolean(),
});

export const tenantRow = z.object({ id: z.uuid(), name: z.string(), slug: z.string() });
export const cityRow = z.object({ id: z.uuid(), tenant_id: z.uuid(), name: z.string() });
export const institutionTypeSchema = z.enum(["devlet", "vakif"]);
export const universityRow = z.object({
  id: z.uuid(),
  tenant_id: z.uuid(),
  city_id: z.uuid(),
  name: z.string(),
  type: institutionTypeSchema,
});
export const programRow = z.object({
  id: z.uuid(),
  name: z.string(),
  score_type: z.enum(["SAY", "EA", "SOZ", "DIL", "TYT"]),
  base_score: z.number(),
  ranking: z.number().nullable(),
  data_year: z.number(),
  source: z.string(),
  universities: z.object({ name: z.string(), type: institutionTypeSchema }),
});
export const housingRow = z.object({
  id: z.uuid(),
  label: z.string(),
  min_price: z.number(),
  max_price: z.number(),
  price_date: z.string(),
  source: z.string(),
});
export const jobRow = z.object({
  id: z.uuid(),
  title: z.string(),
  min_income: z.number(),
  max_income: z.number(),
  price_date: z.string(),
  source: z.string(),
});
export const costRow = z.object({
  id: z.uuid(),
  category: z.string(),
  min_amount: z.number(),
  max_amount: z.number(),
  price_date: z.string(),
  source: z.string(),
});
export const pageRow = z.object({ slug: z.string(), title: z.string(), body: z.string() });
export const auditRow = z.object({
  id: z.number(),
  occurred_at: z.string(),
  actor_id: z.uuid().nullable(),
  tenant_id: z.uuid().nullable(),
  action: z.string(),
  target_type: z.string(),
  target_id: z.string().nullable(),
  result: z.enum(["success", "denied", "failure"]),
  request_id: z.string().nullable(),
});

export function parseRows<S extends z.ZodType>(schema: S, data: unknown): z.infer<S>[] {
  const result = z.array(schema).safeParse(data);
  if (!result.success) {
    throw new Error("Veritabanından beklenmeyen veri biçimi alındı.");
  }
  return result.data;
}

export type AdminUser = {
  id: string;
  tenantId: string | null;
  fullName: string;
  role: Role;
};

export function toAdminUser(row: z.infer<typeof profileRow>): AdminUser {
  return { id: row.id, tenantId: row.tenant_id, fullName: row.full_name, role: row.role };
}

export type City = { id: string; tenantId: string; name: string };
export function toCity(row: z.infer<typeof cityRow>): City {
  return { id: row.id, tenantId: row.tenant_id, name: row.name };
}

export type University = { id: string; tenantId: string; cityId: string; name: string; type: "devlet" | "vakif" };
export function toUniversity(row: z.infer<typeof universityRow>): University {
  return { id: row.id, tenantId: row.tenant_id, cityId: row.city_id, name: row.name, type: row.type };
}
