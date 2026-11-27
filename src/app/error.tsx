"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container">
      <div className="section">
        <h1>Veriler alınamadı</h1>
        <p className="muted">Veritabanına şu anda ulaşılamıyor veya beklenen yapı eksik. Lütfen daha sonra tekrar deneyin.</p>
        <button type="button" onClick={reset}>Yeniden dene</button>
      </div>
    </div>
  );
}
