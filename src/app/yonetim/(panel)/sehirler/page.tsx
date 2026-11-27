import { requireAdminUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { cityRow, parseRows, tenantRow, toCity } from "@/lib/models";
import { ActionForm } from "@/components/action-form";
import { createCityAction, deleteCityAction } from "../actions";

export default async function CitiesPage() {
  const user = await requireAdminUser();
  const supabase = await createClient();

  const { data, error } = await supabase.from("cities").select("id, tenant_id, name").order("name");
  if (error) throw new Error("Şehirler alınamadı.");
  const cities = parseRows(cityRow, data).map(toCity);

  const tenantsResult = user.role === "super_admin" ? await supabase.from("tenants").select("id, name, slug").order("name") : null;
  const tenants = tenantsResult?.error || !tenantsResult ? [] : parseRows(tenantRow, tenantsResult.data);
  const tenantName = new Map(tenants.map((t) => [t.id, t.name]));

  return (
    <>
      <div className="section">
        <h1>Şehirler</h1>
        <ActionForm action={createCityAction} submitLabel="Ekle">
          {user.role === "super_admin" ? (
            <label>
              Kurum
              <select name="tenantId" required defaultValue="">
                <option value="" disabled>Seçiniz</option>
                {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>
          ) : null}
          <label>
            Şehir adı
            <input type="text" name="name" required minLength={2} maxLength={100} />
          </label>
        </ActionForm>
        {user.role === "super_admin" && tenants.length === 0 ? <div className="empty">Henüz kurum kaydı bulunmamaktadır.</div> : null}
      </div>
      <div className="section">
        {cities.length === 0 ? <div className="empty">Kayıtlı şehir bulunmamaktadır.</div> : (
          <table>
            <thead><tr><th>Şehir</th>{user.role === "super_admin" ? <th>Kurum</th> : null}<th></th></tr></thead>
            <tbody>
              {cities.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  {user.role === "super_admin" ? <td>{tenantName.get(c.tenantId) ?? "—"}</td> : null}
                  <td>
                    <ActionForm action={deleteCityAction} submitLabel="Sil" variant="danger" inline>
                      <input type="hidden" name="id" value={c.id} />
                    </ActionForm>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
