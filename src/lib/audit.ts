import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

type AuditEntry = {
  actorId: string | null;
  tenantId: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  result: "success" | "denied" | "failure";
  changes?: Record<string, string | number | boolean | null>;
};

const SENSITIVE_KEY = /pass|token|secret|key|authorization|cookie/i;

function sanitize(
  changes: Record<string, string | number | boolean | null> | undefined,
): Record<string, string | number | boolean | null> | null {
  if (!changes) return null;
  const clean: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(changes)) {
    if (!SENSITIVE_KEY.test(key)) clean[key] = value;
  }
  return clean;
}

export async function writeAudit(entry: AuditEntry): Promise<void> {
  const requestId = (await headers()).get("x-request-id");
  const { error } = await createAdminClient()
    .from("audit_logs")
    .insert({
      actor_id: entry.actorId,
      tenant_id: entry.tenantId,
      action: entry.action,
      target_type: entry.targetType,
      target_id: entry.targetId ?? null,
      result: entry.result,
      request_id: requestId,
      changes: sanitize(entry.changes),
    });
  if (error) {
    throw new Error("Denetim kaydı yazılamadı.");
  }
}
