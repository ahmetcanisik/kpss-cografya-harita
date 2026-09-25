# CLAUDE.md

Bu depo hakkında Claude Code oturumları için bağlam ve talimatlar.

## Proje

Tek dosyalık (`index.html`), self-contained KPSS Coğrafya çalışma haritası.
`src/` altındaki parçalar `build.py` ile birleştirilip `index.html` üretilir —
**kaynak `src/` dosyalarını düzenleyin, `index.html`'i elle düzenlemeyin**,
her değişiklikten sonra:

```bash
python3 build.py     # src/ -> index.html
```

## Mimari

- `src/template.html` — HTML+CSS iskelet, `/*GEO*/ /*DATA*/ /*APP*/` yer tutucuları
- `src/app.js` — çizim, etiketleme, panel, quiz mantığı
- `src/data.js`, `src/notes.js`, `src/examdata.js` — veri (build.py'de sırayla
  birleştirilip `/*DATA*/` yer tutucusuna gider)
- `src/geo.json` — tüm coğrafi geometri (ülke, iller, komşular, book.*, osm.*)
- `src/bookmap.py` — şematik (kitap/sınav) haritalarını ICP ile gerçek Türkiye
  sınırına oturtan yardımcı modül; hem kitap katmanları (`build_book_layers.py`)
  hem de aşağıda anlatılan sınav-haritası dijitalleştirmesi bunu kullanır.

## Quiz sistemi (iki mod)

1. **Keşif Modu** (`QUIZ.mode==='explore'`) — aktif katmanlardaki öğelerden
   rastgele soru, haritaya tıklayarak cevaplanır (geometriye göre doğrulama,
   `judge()`).
2. **Çıkmış Sorular** (`QUIZ.mode==='exam'`) — `src/examdata.js`'teki gerçek
   KPSS sorularını şıklı (A-E) olarak sorar (`renderExamCard()` /
   `submitExamAnswer()`). Haritalı sorularda `q.map` dizisindeki
   `{roman, lon, lat}` noktaları haritada numaralı/harfli daire olarak
   gösterilir (`renderOverlay()` içindeki "çıkmış soru" bloğu).

### examdata.js formatı

Her soru: `{id, exam, q, options, answer (0-index), map?}`.

- `q` metninde madde listeleri (I./II./III.) **mutlaka `\n` ile ayrı satırlara
  bölünmeli** — cümle içine gömülü yazmayın (`"...I. eğitim, II. sağlık..."`
  YANLIŞ). `renderExamCard()` `\n`'i `<br>`'e çevirir ama önce doğru
  yerleştirmeniz gerekir; gerçek KPSS formatında her madde ayrı satırdır.
- `map` alanı varsa iki durum var:
  - `map.length === options.length`: her harita işareti tek bir şıkka karşılık
    gelir (örn. "hangi alanda X görülmez? A)I B)II..."). Cevaplandıktan sonra
    doğru işaret yeşil, seçilen yanlış işaret kırmızı boyanır.
  - `map.length !== options.length`: eşleştirme tipi soru (örn. "I,II,III
    bölgelerinin adları hangi şıkta doğru verilmiştir?"). Bu durumda işaretler
    her zaman nötr renkte kalır (`perMarkerAnswer` kontrolü, `app.js`). Bu
    ayrımı bozmayın — yanlış boyama kafa karıştırır.

## Sınav sorularını genişletme iş akışı (docs/exam/*.pdf)

`docs/exam/` (git'e dahil değil, `.gitignore`'da `docs`) altında kullanıcının
bilgisayarından kopyalanmış gerçek KPSS Ön Lisans/Lisans PDF'leri bulunur.
Yeni coğrafya sorusu çıkarmak için:

1. **Önce dosyanın "tam" mı "teaser" mı olduğunu anlayın.** Bazı PDF'ler
   (özellikle "İlide" markalı veya resmi ÖSYM dosya adı taşıyanlar bile) aslında
   bir tanıtım ürünüdür: konu başına yalnızca 1 soru tam gösterilir, geri kalan
   sayfalar TAMAMEN BOŞTUR (görsel olarak da boş — metin çıkarımı sorunu
   değildir). Birkaç sayfayı `pdftoppm` ile render edip görsel kontrol edin;
   soru numarası görünüp içerik yoksa o dosyadan az sayıda soru çıkar.
2. **Metin çıkarımı önce `pdftotext -layout` ile denenir**; OCR'a (tesseract,
   `tur.traineddata` gerekir — `brew install tesseract-lang` Xcode lisansı
   isteyebilir, alternatif olarak `tessdata_fast` reposundan indirilebilir)
   yalnızca PDF tamamen görsel/taranmışsa başvurulur.
3. **`pdftotext`'in `\f` ile böldüğü sayfa sayısı genelde gerçek sayfa
   sayısından 1 FAZLA çıkar** (trailing boş sayfa). `pdftoppm -f N -l N`
   çağırmadan önce gerçek sayfa sayısı için `pdfinfo` kullanın, yoksa "Wrong
   page range" hatası (exit 99) alırsınız.
4. **Genel Kültür (GK) bölümü sınırı**: "GENEL YETENEK TESTİ BİTTİ." metninin
   göründüğü sayfa + 1'den dosya sonuna kadar. Coğrafya soruları GK içinde
   Tarih ve Vatandaşlık ile karışıktır; anahtar kelime taraması (dağ, iklim,
   akarsu, göl, toprak, nüfus, tarım, sanayi, boylam/enlem, fay, volkan, karst,
   ova, plato, turizm, maden...) ile aday sayfalar bulunup sonra tam
   metin/görsel olarak doğrulanır.
5. **Cevap anahtarı**: bazı dosyalarda soru başına `DOĞRU CEVAP: X` gömülü
   (güvenilir, direkt kullanın). Yoksa kendiniz araştırıp çözün ama SADECE emin
   olduğunuz, iyi belgelenmiş standart coğrafya bilgileriyle (örn. "podzol
   toprak → Rize", "Fiyort kıyısı Türkiye'de yok" gibi ders kitabı seviyesi
   kesin bilgiler). Emin olamadığınız (birden fazla makul cevap, belirsiz
   harita eşleşmesi) soruları EKLEMEYİN — yanlış "doğru cevap" quiz'in
   güvenilirliğini bozar. "Bu soru ... ÖSYM Yönetim Kurulu tarafından iptal
   edilmiştir" notu olan sorular da eklenmemeli.
6. **Alan Bilgisi (PS/PÖS) ve Eğitim Bilimleri (CÖS) testleri coğrafya
   İÇERMEZ**, atlayın (2014-2016 dönemi dosya adlandırmasında CS=GYGK,
   PS/PÖS=Alan Bilgisi, CÖS=Eğitim Bilimleri kodu kullanılır; başlık
   sayfasından teyit edin). EKPSS dosyaları da kapsam dışı.
7. **Yinelenen sınavlar**: aynı sınav farklı klasörlerden/kaynaklardan birden
   fazla kez kopyalanmış olabilir — başlık/tarih/soru içeriği aynıysa tekrar
   soru eklemeyin (örn. `2016KPSSOnLisansDuzeyiTemel16102016.pdf` ile
   `KPSS Ön Lisans 2016.pdf` aynı sınavdır).
8. **Haritalı sorular**: orijinal sayfayı `pdftoppm -r 200` ile render edip,
   `src/bookmap.py`'deki `land_mask()` + `fit()` (ICP) ile o küçük şematik
   Türkiye haritasını gerçek il sınırlarına oturtun; işaretlerin (genelde
   kırmızı/kahverengi blob veya X) piksel merkezini
   `cv2.connectedComponentsWithStats` ile bulup `px_to_lonlat()` ile
   boylam/enleme çevirin (bu oturumda medyan hata genelde <2px). Watermark
   ("ÖSYM" diyagonal yazısı) bazen maskeye karışır — `land_mask`'in "en büyük
   bağlı bileşen" mantığı bunu genelde eler; gerekirse `erase` parametresiyle
   belirli bir dikdörtgeni maskeden çıkarın.
9. Yeni soruları `src/examdata.js`'e ekleyin, `python3 build.py` çalıştırıp
   Playwright ile uçtan uca doğrulayın (bkz. Test).

## Test

Özel bir test framework'ü yok; bu depo statik bir sitedir. Değişiklik sonrası:

```bash
python3 -m http.server 8791   # repo kökünden
```

sonra Playwright (`npx playwright install chromium` + küçük bir node script)
veya `/run` skill'i ile sürüp ekran görüntüsü alın. Özellikle Çıkmış Sorular
modunda tüm soruları döngüyle gezip (`.qopt` tıkla → `#qNext` tıkla) konsol
hatası olmadığını ve harita işaretlerinin (`#over circle`) doğru sayıda
göründüğünü kontrol edin.

## Git / deploy

- `main` branch → GitHub Pages kaynağı
  (`https://ahmetcanisik.github.io/kpss-cografya-harita/`), repo kökünden
  yayınlanır (`gh api repos/ahmetcanisik/kpss-cografya-harita/pages` ile
  teyit edilebilir).
- Feature branch'lerde çalışılır; `main`'e merge + push edilince Pages birkaç
  dakika içinde güncellenir. `main`'e push etmeden/merge etmeden önce
  kullanıcıya sor (canlı siteyi etkiler).
- `docs/` klasörü (kaynak kitap PDF'i + sınav PDF'leri) `.gitignore`'dadır —
  bunlar asla commit edilmemeli (büyük dosyalar, telif).
