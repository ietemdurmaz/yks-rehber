// UYARI: Aşağıdaki veriler ÖRNEKTİR (yaklaşık). Yayına almadan önce YÖK Atlas ve güncel ilanlarla doğrulayın.
const DATA = {
  sehirler: {
    Manisa: {
      universiteler: [
        { ad: "Manisa Celal Bayar Üniversitesi", tur: "Devlet", bolumler: [
          { ad: "Tıp", puanTuru: "SAY", taban: 440, siralama: 18000 },
          { ad: "Diş Hekimliği", puanTuru: "SAY", taban: 425, siralama: 30000 },
          { ad: "Bilgisayar Mühendisliği", puanTuru: "SAY", taban: 410, siralama: 52000 },
          { ad: "Hukuk", puanTuru: "EA", taban: 410, siralama: 28000 }
        ]},
        { ad: "Manisa Teknik Bilimler Üniversitesi", tur: "Devlet", bolumler: [
          { ad: "Bilgisayar Mühendisliği", puanTuru: "SAY", taban: 395, siralama: 75000 },
          { ad: "Elektrik-Elektronik Mühendisliği", puanTuru: "SAY", taban: 380, siralama: 100000 }
        ]}
      ],
      konaklama: [
        { tip: "KYK Yurdu (aylık)", min: 1500, max: 3000 },
        { tip: "Özel yurt (aylık)", min: 6000, max: 12000 },
        { tip: "Ev arkadaşlı oda (aylık)", min: 5000, max: 8000 },
        { tip: "1+1 daire (aylık)", min: 9000, max: 15000 }
      ],
      isler: [
        { ad: "Kafe / restoran garson", aylik: [8000, 14000] },
        { ad: "Mağaza satış danışmanı (part-time)", aylik: [8000, 13000] },
        { ad: "Özel ders verme", aylik: [5000, 15000] },
        { ad: "Kargo / paketleme", aylik: [9000, 15000] }
      ],
      yasam: { yemek: [5000, 8000], ulasim: [800, 1500], diger: [1500, 3000] }
    }
  }
};
