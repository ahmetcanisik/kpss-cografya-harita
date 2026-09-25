# KPSS Coğrafya Haritası

Türkiye'nin yer şekilleri, suları, toprakları ve deprem bölgeleri için etkileşimli,
tek dosyalık (self-contained) bir KPSS çalışma haritası. Birincil kaynak
`docs/source.pdf` (KPSS Coğrafya video ders kitabı, taranmış 255 sayfa).

## Katmanlar

| Grup | Katman | Geometri kaynağı |
|---|---|---|
| Yer şekilleri | Kırık dağlar (horst çizgileri + graben) | kitap s.57 şeması |
| | Kıvrım dağları (çizgi) | kitap s.55 haritasından sayısallaştırıldı |
| | Volkanik dağlar | kitap s.57 |
| | Fay hatları | elle, şehirlerle |
| | Ovalar (delta, karstik, eski göl tabanı, lav örtüsü, tektonik, dağ eteği) | kitap s.64-67 |
| | Platolar (aşınım, karstik, lav, tüf, yatay duruşlu) | kitap s.60 |
| | Masifler | kitap s.21-22 |
| Su | Nehirler, kollar, sınır akarsuları | OpenStreetMap güzergâhı, sınıflandırma kitap s.92-94 |
| | Göller (türleriyle) | OpenStreetMap, türler kitap s.97-101 |
| | Barajlar | OpenStreetMap, liste kitap s.102 |
| | Akarsu havzaları (açık/kapalı) | kitap s.93 |
| Toprak ve deprem | Topraklar | kitap s.112-114 |
| | Deprem bölgeleri (1-5. derece) | kitap s.33 |
| Genel | Bölgeler, 81 il, komşular, levhalar | il.json, Natural Earth |

## Quiz

İki mod var, "🧠 Bilgini test et" kutusundaki düğmelerle seçilir.

### Keşif Modu

5 veya 8 soru, "Daha fazla…" ile 12–100 arası. Sorular aktif katmanlardan gelir.
Doğrulama merkez noktaya uzaklıkla değil, hedefin geometrisiyle yapılır:

- alanlarda (il, bölge, ova, plato, masif, göl, toprak, havza…) tıklama alanın içindeyse
  ya da sınırına tolerans kadar yakınsa doğru,
- çizgilerde (nehir, fay, kıvrım dağı, horst) çizgiye tolerans kadar yakınsa doğru,
- noktalarda (volkan, baraj, graben) km toleransıyla.

Tolerans ekranda ~14 px'e karşılık gelir (en az 8, en çok 30 km); yanlışta
en yakın mesafe yazılır ve doğru geometri yeşil vurgulanır.

### Çıkmış Sorular

Gerçek KPSS sınavlarından çıkarılmış coğrafya sorularını, orijinal şıklarıyla
(A-E) sorar (`src/examdata.js`). Haritalı sorularda, orijinal sınavdaki
numaralandırılmış alanlar aynı Romen rakamlarıyla bizim haritamızda da
işaretlenir — konumlar, kitap katmanlarını gerçek sınıra oturttuğumuz aynı ICP
yöntemiyle (`src/bookmap.py`) dijitalleştirildi. Bu soru havuzunu genişletme
adımları için `CLAUDE.md`'ye bakın.

Soru kartı başlık çubuğundan sürüklenerek haritanın üzerinden taşınabilir.
Sağ üstteki yakınlaştırma kümesindeki katman ikonlu düğme, masaüstünde sol
paneli kaydırmadan katmanları açıp kapatmayı sağlar.

## Dosya yapısı ve üretim

```
index.html                 ← üretilen, yayınlanabilir tek dosya
build.py                   ← src/ parçalarını index.html'e birleştirir
src/template.html          ← HTML + CSS iskeleti (/*GEO*/ /*DATA*/ /*APP*/)
src/app.js                 ← çizim, etiket motoru, panel, quiz
src/data.js                ← elle tutulan veri: volkanlar, horstlar, faylar, akarsu/göl/baraj bilgileri
src/notes.js               ← KPSS notları (GENERAL + NOTES), kitaba göre
src/examdata.js            ← gerçek KPSS çıkmış soruları (Çıkmış Sorular modu)
src/geo.json               ← tüm geometri (ülke, iller, komşular, book.*, osm.*)
src/bookmap.py             ← kitap haritalarını coğrafi koordinata oturtma (ICP) ve sayısallaştırma yardımcıları
src/build_book_layers.py   ← kitap sayfalarından geo.json → book.{soils,plateaus,plains,massifs,basins,quake,folds}
src/build_osm.py           ← OSM'den geo.json → osm.{rivers,lakes,dams}
src/build_geo2.py, geo.py, build_neighbors.py ← il/ülke/komşu sınırlarını üreten ilk betikler
```

```bash
python3 build.py                                # yalnızca index.html'i yeniden üretir
cd src && python3 build_book_layers.py          # kitap katmanları (docs/source.pdf ve pdftoppm gerekir)
cd src && python3 build_osm.py --fetch          # OSM verisini yeniden indirip işler
```

Kitap katmanları için: `pip install numpy pillow shapely scipy opencv-python-headless`.
Ara dosyalar `.cache/` altında tutulur (git dışı). Kitap haritaları gerçek il
sınırlarına ~2 px (≈2 km) medyan hatayla oturtulur; alan sınırları yine de
kitap şemasının sayısallaştırılmış, yaklaşık hâlidir.
