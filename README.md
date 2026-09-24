# KPSS Coğrafya Haritası — proje durumu (devir teslim)

Bu klasör, Türkiye yerşekilleri / KPSS coğrafya haritası projesinin şu anki
(tamamlanmamış) halidir. Yeni bir konuşmada devam edilmesi için hazırlandı.

## Dosya yapısı

```
dist/turkiye-yersekilleri.html   ← ÇALIŞAN, tek parça, yayınlanabilir son çıktı
src/template.html                ← İskelet HTML + CSS (yer tutucular: /*GEO*/ /*DATA*/ /*APP*/)
src/data.js                      ← Ham veri: dağlar (horst/graben), fay hatları, ova/plato, masif, levha,
                                    il koordinatları, bölge-il eşlemesi, göller, nehirler ve akarsular
src/notes.js                     ← KPSS notları: GENERAL (kategori geneli) + NOTES (öğe bazlı)
                                    + REGIONS (bölge adı/renk eşlemesi)
src/app.js                       ← Tüm mantık: harita çizimi, etiket çakışma-önleme motoru,
                                    pan/zoom, panel listesi, quiz motoru (arka uç)
src/geo.json                     ← Önceden hesaplanmış SVG path verisi: ülke sınırı (Natural
                                    Earth 10m), komşu ülkeler silueti, 81 il sınırı (gerçek
                                    idari veri, bkz. aşağı), gerçek göl poligonları (Van, Tuz,
                                    Beyşehir, Eğirdir), komşu ülke path/etiket noktaları,
                                    bölge merkez noktaları
src/il.json                      ← 81 ilin ham GeoJSON sınırları (kaynak: GitHub
                                    alpers/Turkey-Maps-GeoJSON, tr-cities.json) — geo.json
                                    içindeki "prov" alanı bundan türetildi
src/build_geo2.py                ← il.json'dan bölge/il path'lerini ve bölge merkezlerini
                                    üreten Python betiği (shapely kullanır)
src/geo.py                       ← Ülke/komşu ülke sınırlarını Natural Earth'ten sadeleştirip
                                    SVG path'e çeviren ilk betik (RDP algoritması)
src/build_neighbors.py           ← Natural Earth 50m verisinden sekiz komşu ülke geometrisi
                                    ve görünür etiket noktaları üreten betik
```

**Son HTML nasıl üretiliyor:** `template.html` içindeki `/*GEO*/`, `/*DATA*/`, `/*APP*/`
yer tutucuları sırasıyla `geo.json` (JSON.stringify), `data.js`+`notes.js` (ham metin) ve
`app.js` (ham metin) ile değiştirilip `kpss-cografya-haritasi.html` adıyla
`/mnt/user-data/outputs/` altına yazılıyor, sonra Artifact tool'un mevcut URL'yi güncelleyen
`publish` action'ıyla yayınlanıyor. `src/template.html` yalnızca kaynak iskelet olarak kalır.

`lakes10.json` (Natural Earth 10m göller, ~5MB) zip'e dahil edilmedi çünkü ondan
üretilen 4 gerçek göl poligonu zaten `geo.json` içine gömülü. Gerekirse şu adresten
tekrar indirilebilir: `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_lakes.geojson`

## Şu ana kadar tamamlananlar

- Dağlar (kırık/kıvrım/volkanik), fay hatları (şehir adlarıyla), ova/plato (bölge +
  şehirle), masifler, levhalar, 81 il adı katmanı — hepsi çalışıyor, KPSS notlarıyla.
- **Bölgeler katmanı gerçek idari sınırlarla yeniden yapıldı:** artık dışbükey zarf
  (convex hull) değil, 81 ilin gerçek GeoJSON sınırlarının birleşimi kullanılıyor.
  Her il kendi bölgesinin rengiyle boyanıyor → bölgeler arasında **boşluk veya
  çakışma yok**, tüm ülke 7 bölgeye tam olarak bölünmüş durumda (`src/build_geo2.py`
  ile üretildi, `geo.json.prov` içinde).
- **Göller katmanı eklendi:** Van, Tuz, Beyşehir, Eğirdir gerçek poligonlarla;
  İznik, Sapanca, Manyas, Uluabat, Salda, Acıgöl, Burdur, Akşehir, Eber, Çıldır,
  Hazar, Erçek, Kovada yaklaşık elips ile (`data.js` → `LAKES_APPROX`). Genel bilgi
  kutusu (göl oluşum türleri: tektonik/karstik/volkanik/set/buzul) ve her göl için
  ayrı KPSS notu `notes.js` içinde mevcut.
- **Nehirler ve akarsular katmanları eklendi:** Kaynak PDF'de geçen başlıca
  havzalar ve akarsular iki ayrı katmanda gösterilir. Nehir çizgileri daha
  kalın, akarsu kolları daha ince çizilir; güzergâhlar bu harita ölçeğinde
  yaklaşık gösterimdir. Katmanların genel KPSS notları `notes.js` içindedir.
- **Quiz motoru (arka uç) yazıldı** (`app.js` içinde `QUIZ` nesnesi ve
  `buildQuizPool / startQuiz / submitGuess / nextQ / renderQuizCard / renderQuizDone /
  endQuiz` fonksiyonları): aktif katmanlardan soru havuzu kuruluyor, haritaya
  tıklanan nokta ile doğru nokta arası km cinsinden mesafe hesaplanıyor, kategoriye
  göre tolerans (`TOL` sabiti) ile doğru/yanlış belirleniyor, skor tutuluyor.

## Tamamlanan yeni yüzeyler

- Quiz arayüzü panelde 5/8/12 soru seçimi, harita üstü soru kartı ve mobil dokunma akışını içerir.
- Komşularımız katmanı Natural Earth 50m verisinden sekiz ülkeyi ayrı path ve etiket noktasıyla gösterir.
- Kırık dağlar Horstlar ve Grabenler alt listelerine ayrılmış; dört ana Ege grabeni ters üçgenle çizilir.

## Devam notları

1. Quiz arayüzü `#quizcard`, `#quizStart` ve `.qn` ile bağlandı; Playwright ile
   masaüstü ve mobilde soru, tahmin işaretleri ve mesafe sonucu doğrulandı.

2. **`docs/source.pdf` bu projenin birincil kaynağıdır.** PDF kaynağı taranmış olduğu için konu bazlı işlendi. Kullanıcı KPSS'ye temel aldığı bir kaynak
   PDF paylaştı (255 sayfa). `pdfinfo`/`pdffonts`/`pdftotext` denendi: PDF bir
   RICOH fotokopi/tarayıcıdan çıkmış, **metin katmanı yok** (taranmış görüntü).
   Yani `pdftotext` boş dönüyor. Devam eden oturumda:
   - Önce toplu OCR ile aranabilir metin çıkarılmalı (pytesseract, her sayfa
     görüntüye çevrilip OCR'lanmalı — 255 sayfa için zaman alır, gerekirse
     partiler halinde yapılmalı).
   - Dağlar/ovalar/platolar/masifler/göller/fay hatları/bölgeler/komşular ile
     ilgili bölümler `pdftoppm` ile 150 DPI görüntüye çevrilip görsel olarak da
     okunmalı (tablo/şema içeren sayfalar OCR'da bozulabilir).
   - **Kullanıcının talimatı net:** bu kitap artık `data.js`/`notes.js` içindeki
     tüm `GENERAL` ve `NOTES` içeriğinin **birincil kaynağı** olacak. Mevcut
     notlar genel bilgiye dayanılarak yazıldı; kitapla çapraz kontrol edilip
     gerekirse düzeltilmeli, eksik kalan sık sorulan bilgiler eklenmeli, kitapta
     yer almayan/vurgulanmayan ayrıntılar gerekirse sadeleştirilmeli.

3. Komşularımız katmanı Natural Earth 50m admin-0 verisinden sekiz ülkeyi ayrı
   geometrilerle gösterir; panel listesi ve KPSS notları dahildir.
4. Kırık dağlar Horstlar ve Grabenler alt listelerine ayrılmıştır. Dört ana Ege
   grabeni ters üçgen sembolüyle ayırt edilir.
5. Harita adı `KPSS Coğrafya Haritası` olarak kaynak HTML'de güncellenmiştir.

## Kesin genel kurallar (bu proje için bağlayıcı)

Devam promptunda ayrıntılı verildi — özetle: tek parça self-contained HTML,
mevcut tasarım dilini (renk paleti, tipografi, panel/liste yapısı, etiket
çakışma motoru) bozmadan üzerine inşa et, gerçek coğrafi veri kullan (yaklaşık
gösterimler açıkça belirtilsin), her değişiklikten sonra Playwright ile test
et, Türkçe ve KPSS'ye uygun temkinli dil kullan.
