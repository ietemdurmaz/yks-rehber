const $ = id => document.getElementById(id);
const tl = n => n.toLocaleString("tr-TR") + " ₺";
Object.keys(DATA.sehirler).forEach(s => $("sehir").add(new Option(s, s)));

$("form").addEventListener("submit", e => {
  e.preventDefault();
  const puan = +$("puan").value, tur = $("tur").value;
  const bolum = $("bolum").value.trim().toLocaleLowerCase("tr");
  const utur = $("utur").value;
  const s = DATA.sehirler[$("sehir").value];
  let html = "";

  const rows = [];
  s.universiteler.filter(u => !utur || u.tur === utur).forEach(u =>
    u.bolumler.filter(b => b.ad.toLocaleLowerCase("tr").includes(bolum) && (tur === "TYT" || b.puanTuru === tur))
      .forEach(b => {
        const fark = puan - b.taban;
        const d = fark >= 10 ? ["ok", "Yüksek ihtimal"] : fark >= -5 ? ["mid", "Sınırda"] : ["no", "Düşük ihtimal"];
        rows.push(`<tr><td>${u.ad}</td><td>${u.tur}</td><td>${b.ad}</td><td>${b.taban}</td><td class="${d[0]}">${d[1]}</td></tr>`);
      }));
  html += `<div class="card"><h2>Üniversiteler</h2>` + (rows.length
    ? `<table><tr><th>Üniversite</th><th>Tür</th><th>Bölüm</th><th>Taban</th><th>Durum</th></tr>${rows.join("")}</table>`
    : "<p>Bu kriterlere uygun bölüm bulunamadı (örn. bu şehirde vakıf üniversitesi olmayabilir).</p>") + "</div>";

  html += `<div class="card"><h2>Konaklama</h2><table>${s.konaklama.map(k => `<tr><td>${k.tip}</td><td>${tl(k.min)} – ${tl(k.max)}</td></tr>`).join("")}</table></div>`;
  html += `<div class="card"><h2>Part-time İşler</h2><table>${s.isler.map(i => `<tr><td>${i.ad}</td><td>${tl(i.aylik[0])} – ${tl(i.aylik[1])}/ay</td></tr>`).join("")}</table></div>`;

  const y = s.yasam, minK = Math.min(...s.konaklama.map(k => k.min)), maxK = Math.max(...s.konaklama.map(k => k.max));
  const gMin = minK + y.yemek[0] + y.ulasim[0] + y.diger[0];
  const gMax = maxK + y.yemek[1] + y.ulasim[1] + y.diger[1];
  const kMin = Math.min(...s.isler.map(i => i.aylik[0])), kMax = Math.max(...s.isler.map(i => i.aylik[1]));
  html += `<div class="card"><h2>Aylık Bütçe Özeti</h2>
    <p>Tahmini gider: <b>${tl(gMin)} – ${tl(gMax)}</b></p>
    <p>Part-time kazanç: <b>${tl(kMin)} – ${tl(kMax)}</b></p></div>`;
  $("sonuc").innerHTML = html;
});
$("form").dispatchEvent(new Event("submit"));
