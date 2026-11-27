import { requireAdminUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const tables = [
  { table: "cities", label: "Şehir" },
  { table: "universities", label: "Üniversite" },
  { table: "programs", label: "Bölüm" },
  { table: "housing_options", label: "Konaklama kaydı" },
  { table: "job_listings", label: "İş kaydı" },
  { table: "living_costs", label: "Yaşam gideri kaydı" },
  { table: "site_pages", label: "Bilgi sayfası" },
] as const;

export default async function OverviewPage() {
  await requireAdminUser();
  const supabase = await createClient();
  const counts = await Promise.all(
    tables.map(async (t) => {
      const { count, error } = await supabase.from(t.table).select("id", { count: "exact", head: true });
      return { label: t.label, count: error ? null : count };
    }),
  );
  return (
    <div className="section">
      <h1>Genel Durum</h1>
      <p className="muted">Yetkiniz kapsamındaki kayıt sayıları.</p>
      <table>
        <thead><tr><th>Kayıt türü</th><th>Adet</th></tr></thead>
        <tbody>
          {counts.map((c) => (
            <tr key={c.label}><td>{c.label}</td><td>{c.count ?? "Alınamadı"}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
