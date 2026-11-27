import { requireAdminUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { auditRow, parseRows } from "@/lib/models";
import { formatDateTime } from "@/lib/format";

const resultLabel = { success: "Başarılı", denied: "Reddedildi", failure: "Başarısız" } as const;

export default async function AuditPage() {
  await requireAdminUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, occurred_at, actor_id, tenant_id, action, target_type, target_id, result, request_id")
    .order("occurred_at", { ascending: false })
    .limit(200);
  if (error) throw new Error("Denetim kayıtları alınamadı.");
  const rows = parseRows(auditRow, data);

  return (
    <div className="section">
      <h1>Denetim Kayıtları</h1>
      <p className="muted">Son 200 kayıt gösterilmektedir.</p>
      {rows.length === 0 ? <div className="empty">Kayıt bulunmamaktadır.</div> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Zaman</th><th>İşlem</th><th>Hedef</th><th>Kullanıcı</th><th>Sonuç</th><th>İstek no</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{formatDateTime(r.occurred_at)}</td>
                  <td>{r.action}</td>
                  <td>{r.target_type}{r.target_id ? ` / ${r.target_id}` : ""}</td>
                  <td>{r.actor_id ?? "—"}</td>
                  <td>{resultLabel[r.result]}</td>
                  <td>{r.request_id ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
