const $ = id => document.getElementById(id);
const tl = n => Math.round(n).toLocaleString("tr-TR") + " ₺";
Object.keys(DATA.sehirler).forEach(s => $("sehir").add(new Option(s, s)));

$("form").addEventListener("submit", e => {
  e.preventDefault();
  const puan = +$("puan").value, tur = $("tur").value;
  const bolum = $("bolum").value.trim().toLocaleLowerCase("tr");
  const utur = $("utur").value;
  const s = DATA.sehirler[$("sehir").value];

  const items = [];
  s.universiteler.filter(u => !utur || u.tur === utur).forEach(u =>
    u.bolumler.filter(b => b.ad.toLocaleLowerCase("tr").includes(bolum) && (tur === "TYT" || b.puanTuru === tur))
      .forEach(b => {
        const fark = puan - b.taban;
        const d = fark >= 10 ? ["ok", "Yüksek ihtimal"] : fark >= -5 ? ["mid", "Sınırda"] : ["no", "Düşük ihtimal"];
        const pct = Math.max(5, Math.min(100, 50 + fark * 3));
        const renk = { ok: "var(--ok)", mid: "var(--mid)", no: "var(--no)" }[d[0]];
        items.push(`<div class="uni"><div><b>${u.ad}</b><small>${u.tur} · ${b.ad} · Taban ${b.taban}</small></div>
          <div class="meter"><i style="width:${pct}%;background:${renk}"></i></div><span class="badge b-${d[0]}">${d[1]}</span></div>`);
      }));

  const maxK = Math.max(...s.konaklama.map(k => k.max));
  const kon = s.konaklama.map(k => `<div class="row"><div><span>${k.tip}</span><b>${tl(k.min)} – ${tl(k.max)}</b></div>
    <div class="bar"><i style="left:${k.min / maxK * 100}%;width:${(k.max - k.min) / maxK * 100}%"></i></div></div>`).join("");

  const isler = s.isler.map(i => `<div class="chip"><b>${i.ad}</b><span>${tl(i.aylik[0])} – ${tl(i.aylik[1])}/ay</span></div>`).join("");

  const y = s.yasam;
  const minK = Math.min(...s.konaklama.map(k => k.min));
  const gMin = minK + y.yemek[0] + y.ulasim[0] + y.diger[0];
  const gMax = maxK + y.yemek[1] + y.ulasim[1] + y.diger[1];
  const kMin = Math.min(...s.isler.map(i => i.aylik[0])), kMax = Math.max(...s.isler.map(i => i.aylik[1]));

  $("sonuc").innerHTML = `
  <section id="tercih" class="panel sec"><h2>Tercih Analizi</h2><p class="sub">${puan} puan ile ${$("bolum").value} için ihtimaller</p>
    ${items.join("") || "<p>Bu kriterlere uygun bölüm bulunamadı.</p>"}</section>
  <section id="konaklama" class="panel sec"><h2>Konaklama</h2><p class="sub">Aylık tahmini aralıklar</p>${kon}</section>
  <section id="is" class="panel sec"><h2>Part-time İş Fırsatları</h2><p class="sub">Tahmini aylık kazanç</p><div class="chips">${isler}</div></section>
  <section id="butce" class="panel sec"><h2>Aylık Bütçe</h2><p class="sub">Konaklama, yemek, ulaşım ve diğer giderler</p>
    <div class="kpis"><div class="kpi"><small>Tahmini gider</small><div>${tl(gMin)} – ${tl(gMax)}</div></div>
    <div class="kpi"><small>Part-time kazanç</small><div>${tl(kMin)} – ${tl(kMax)}</div></div></div>
    <div class="net">Part-time gelirle en iyi durumda açık: ${tl(Math.max(0, gMin - kMax))} · en kötü durumda aile desteği ihtiyacı: ${tl(Math.max(0, gMax - kMin))}</div></section>`;
});
$("form").dispatchEvent(new Event("submit"));
