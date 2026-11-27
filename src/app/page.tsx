import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { cityRow, costRow, housingRow, jobRow, parseRows, programRow, toCity } from "@/lib/models";
import {
  formatDate,
  formatNumber,
  formatRange,
  institutionLabel,
  scoreTypeLabel,
} from "@/lib/format";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const searchSchema = z.object({
  puan: z.coerce.number().min(0).max(600).optional(),
  bolum: z.string().trim().max(100).optional(),
  sehir: z.uuid().optional(),
});

function first(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v === undefined || v === "" ? undefined : v;
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

function Empty({ text }: { text: string }) {
  return <div className="empty">{text}</div>;
}

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const parsed = searchSchema.safeParse({
    puan: first(raw.puan),
    bolum: first(raw.bolum),
    sehir: first(raw.sehir),
  });
  const filters = parsed.success ? parsed.data : {};
  const invalidInput = !parsed.success;

  const supabase = await createClient();
  const citiesResult = await supabase.from("cities").select("id, tenant_id, name").order("name");
  if (citiesResult.error) throw new Error("Şehirler alınamadı.");
  const cities = parseRows(cityRow, citiesResult.data).map(toCity);

  const cityId = filters.sehir;
  const selectedCity = cities.find((c) => c.id === cityId);

  let programsQuery = supabase
    .from("programs")
    .select("id, name, score_type, base_score, ranking, data_year, source, universities!inner(name, type, city_id)")
    .order("base_score", { ascending: false });
  if (cityId) programsQuery = programsQuery.eq("universities.city_id", cityId);
  if (filters.bolum) programsQuery = programsQuery.ilike("name", `%${escapeLike(filters.bolum)}%`);

  const [programsResult, housingResult, jobsResult, costsResult] = await Promise.all([
    programsQuery,
    cityId ? supabase.from("housing_options").select("id, label, min_price, max_price, price_date, source").eq("city_id", cityId) : null,
    cityId ? supabase.from("job_listings").select("id, title, min_income, max_income, price_date, source").eq("city_id", cityId) : null,
    cityId ? supabase.from("living_costs").select("id, category, min_amount, max_amount, price_date, source").eq("city_id", cityId) : null,
  ]);
  if (programsResult.error) throw new Error("Bölümler alınamadı.");
  const programs = parseRows(programRow, programsResult.data);
  const housing = housingResult?.error ? [] : parseRows(housingRow, housingResult?.data ?? []);
  const jobs = jobsResult?.error ? [] : parseRows(jobRow, jobsResult?.data ?? []);
  const costs = costsResult?.error ? [] : parseRows(costRow, costsResult?.data ?? []);

  return (
    <div className="container">
      <section className="section">
        <h1>Tercih ve Şehir Bilgileri</h1>
        <p className="muted">Puan, bölüm ve şehir bilgisine göre taban puanları ve şehirdeki yaşam giderlerini görüntüleyin.</p>
        <form className="filters" method="get">
          <label>
            YKS puanı
            <input type="number" name="puan" min={0} max={600} step="0.01" defaultValue={filters.puan ?? ""} />
          </label>
          <label>
            Bölüm adı
            <input type="text" name="bolum" maxLength={100} defaultValue={filters.bolum ?? ""} />
          </label>
          <label>
            Şehir
            <select name="sehir" defaultValue={cityId ?? ""}>
              <option value="">Tümü</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <button type="submit">Listele</button>
        </form>
        {invalidInput ? <p className="msg-error">Girilen değerler geçersiz. Puan 0 ile 600 arasında olmalıdır.</p> : null}
        {cities.length === 0 ? <Empty text="Henüz şehir kaydı girilmemiştir." /> : null}
      </section>

      <section className="section">
        <h2>Bölümler</h2>
        {programs.length === 0 ? (
          <Empty text="Seçilen ölçütlere uygun bölüm kaydı bulunmamaktadır." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Üniversite</th><th>Tür</th><th>Bölüm</th><th>Puan türü</th><th>Taban puan</th>
                  {filters.puan !== undefined ? <th>Puan farkı</th> : null}
                  <th>Başarı sırası</th><th>Yıl</th><th>Kaynak</th>
                </tr>
              </thead>
              <tbody>
                {programs.map((p) => (
                  <tr key={p.id}>
                    <td>{p.universities.name}</td>
                    <td>{institutionLabel[p.universities.type]}</td>
                    <td>{p.name}</td>
                    <td>{scoreTypeLabel[p.score_type]}</td>
                    <td>{formatNumber(p.base_score)}</td>
                    {filters.puan !== undefined ? <td>{formatNumber(filters.puan - p.base_score)}</td> : null}
                    <td>{p.ranking === null ? "—" : formatNumber(p.ranking)}</td>
                    <td>{p.data_year}</td>
                    <td>{p.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedCity ? (
        <>
          <section className="section">
            <h2>{selectedCity.name} – Konaklama</h2>
            {housing.length === 0 ? <Empty text="Bu şehir için konaklama kaydı girilmemiştir." /> : (
              <div className="table-wrap"><table>
                <thead><tr><th>Seçenek</th><th>Aylık ücret</th><th>Tarih</th><th>Kaynak</th></tr></thead>
                <tbody>{housing.map((h) => (
                  <tr key={h.id}><td>{h.label}</td><td>{formatRange(h.min_price, h.max_price)}</td><td>{formatDate(h.price_date)}</td><td>{h.source}</td></tr>
                ))}</tbody>
              </table></div>
            )}
          </section>
          <section className="section">
            <h2>{selectedCity.name} – Çalışma Olanakları</h2>
            {jobs.length === 0 ? <Empty text="Bu şehir için iş kaydı girilmemiştir." /> : (
              <div className="table-wrap"><table>
                <thead><tr><th>Pozisyon</th><th>Aylık gelir</th><th>Tarih</th><th>Kaynak</th></tr></thead>
                <tbody>{jobs.map((j) => (
                  <tr key={j.id}><td>{j.title}</td><td>{formatRange(j.min_income, j.max_income)}</td><td>{formatDate(j.price_date)}</td><td>{j.source}</td></tr>
                ))}</tbody>
              </table></div>
            )}
          </section>
          <section className="section">
            <h2>{selectedCity.name} – Yaşam Giderleri</h2>
            {costs.length === 0 ? <Empty text="Bu şehir için yaşam gideri kaydı girilmemiştir." /> : (
              <div className="table-wrap"><table>
                <thead><tr><th>Kalem</th><th>Aylık tutar</th><th>Tarih</th><th>Kaynak</th></tr></thead>
                <tbody>{costs.map((c) => (
                  <tr key={c.id}><td>{c.category}</td><td>{formatRange(c.min_amount, c.max_amount)}</td><td>{formatDate(c.price_date)}</td><td>{c.source}</td></tr>
                ))}</tbody>
              </table></div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
