import { requireAdminUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { cityRow, parseRows, toCity, toUniversity, universityRow } from "@/lib/models";
import { institutionLabel } from "@/lib/format";
import { ActionForm } from "@/components/action-form";
import { createUniversityAction, deleteUniversityAction } from "../actions";

export default async function UniversitiesPage() {
  await requireAdminUser();
  const supabase = await createClient();

  const [citiesResult, universitiesResult] = await Promise.all([
    supabase.from("cities").select("id, tenant_id, name").order("name"),
    supabase.from("universities").select("id, tenant_id, city_id, name, type").order("name"),
  ]);
  if (citiesResult.error || universitiesResult.error) throw new Error("Veriler alınamadı.");
  const cities = parseRows(cityRow, citiesResult.data).map(toCity);
  const universities = parseRows(universityRow, universitiesResult.data).map(toUniversity);
  const cityName = new Map(cities.map((c) => [c.id, c.name]));

  return (
    <>
      <div className="section">
        <h1>Üniversiteler</h1>
        {cities.length === 0 ? <div className="empty">Üniversite eklemek için önce şehir kaydı girilmelidir.</div> : (
          <ActionForm action={createUniversityAction} submitLabel="Ekle">
            <label>
              Şehir
              <select name="cityId" required defaultValue="">
                <option value="" disabled>Seçiniz</option>
                {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label>
              Üniversite adı
              <input type="text" name="name" required minLength={2} maxLength={200} />
            </label>
            <label>
              Tür
              <select name="type" required defaultValue="devlet">
                <option value="devlet">Devlet</option>
                <option value="vakif">Vakıf</option>
              </select>
            </label>
          </ActionForm>
        )}
      </div>
      <div className="section">
        {universities.length === 0 ? <div className="empty">Kayıtlı üniversite bulunmamaktadır.</div> : (
          <table>
            <thead><tr><th>Üniversite</th><th>Şehir</th><th>Tür</th><th></th></tr></thead>
            <tbody>
              {universities.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{cityName.get(u.cityId) ?? "—"}</td>
                  <td>{institutionLabel[u.type]}</td>
                  <td>
                    <ActionForm action={deleteUniversityAction} submitLabel="Sil" variant="danger" inline>
                      <input type="hidden" name="id" value={u.id} />
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
