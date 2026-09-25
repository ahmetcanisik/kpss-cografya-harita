// Gerçek KPSS çıkmış sorularından coğrafya soruları (Genel Kültür testi).
// Her soru: kaynak, soru metni, şıklar, doğru şık indeksi (0=A).
// "map" varsa: orijinal sorudaki haritada Romen rakamıyla işaretli her yer,
// kitabın kendi haritalarında olduğu gibi (bkz. src/bookmap.py) gerçek
// Türkiye sınırına ICP ile oturtularak boylam/enleme çevrildi.
const EXAM_Q = [
  {
    id: '2026-lisans-gk-29',
    exam: 'KPSS Lisans 2026 · Genel Kültür',
    q: 'Kireç taşı, tuz ve jips gibi çözünebilen kayaçların yaygın olduğu alanlarda karstik yer şekilleri oluşur.\n\nYukarıdaki haritada numaralandırılarak gösterilen alanların hangisinde bu yer şekilleri görülmez?',
    options: ['I', 'II', 'III', 'IV', 'V'],
    answer: 1,
    map: [
      { roman: 'I', lon: 33.071, lat: 41.601 },
      { roman: 'II', lon: 41.801, lat: 41.243 },
      { roman: 'III', lon: 43.478, lat: 37.499 },
      { roman: 'IV', lon: 32.787, lat: 36.357 },
      { roman: 'V', lon: 28.026, lat: 37.237 }
    ]
  },
  {
    id: '2026-lisans-gk-37',
    exam: 'KPSS Lisans 2026 · Genel Kültür',
    q: 'Türkiye nüfusunun son yıllardaki değişim özellikleriyle ilgili\nI. Doğum oranı azalmaktadır.\nII. Doğumda beklenen yaşam süresi azalmaktadır.\nIII. Yaşlı nüfus oranı azalmaktadır.\nifadelerinden hangileri doğrudur?',
    options: ['Yalnız I', 'Yalnız II', 'I ve II', 'I ve III', 'II ve III'],
    answer: 0
  },
  {
    id: '2022-lisans-gk-33',
    exam: 'KPSS Lisans 2022 · Genel Kültür',
    q: 'Anadolu\'da jeolojik dönemler boyunca yağışlı ve nemli iklim koşullarına bağlı olarak gür bir bitki örtüsü gelişmiştir. Bu bitkilerin göl ve bataklık ortamlarda birikmesi sonucu zamanla zengin kömür yatakları oluşmuştur. Bunlardan rezerv bakımından en zengin olanı, linyit yataklarıdır. Soma, Yatağan, Elbistan gibi linyit yatakları bunlardan bazılarıdır.\n\nBu yataklar aşağıdaki jeolojik dönemlerin hangisinde oluşmuştur?',
    options: ['Prekambriyen', 'Paleozoyik', 'Mesozoyik', 'Tersiyer', 'Kuvaterner'],
    answer: 3
  },
  {
    id: '2022-lisans-gk-41',
    exam: 'KPSS Lisans 2022 · Genel Kültür',
    q: 'Sanayinin kuruluş yeri seçiminde ham maddeye yakın olmak önemli unsurlardan biridir. Ancak Türkiye\'de ham maddeye uzak alanlarda, bazı sanayi kollarının geliştiği dikkati çeker. Bunlardan biri de tekstil sanayisidir. Nitekim, kimi illerde pamuk yetiştirilmediği hâlde pamuklu dokuma sanayisi gelişmiştir.\n\nAşağıdaki illerin hangisinde ticari olarak bu tarım ürünü yetiştirilmediği hâlde dokuma sanayisi bulunmaktadır?',
    options: ['Gaziantep', 'Kayseri', 'Antalya', 'Denizli', 'Aydın'],
    answer: 1
  },
  {
    id: '2018-onlisans-kitapcik-gk-45',
    exam: 'KPSS Ön Lisans 2018 · Genel Kültür',
    q: 'Türkiye\'de, ekonomi politikaları belirlenirken iller ve bölgeler arasındaki kalkınma farkını azaltmak amacıyla çeşitli önlemler alınmakta ve az gelişmiş illerde bazı destekleyici uygulamalar yapılmaktadır.\n\nAşağıdakilerden hangisi bu uygulama ve önlemlerden biri değildir?',
    options: ['Özel sektörün teşvik edilmesi', 'Vergi indirimi', 'Ucuz enerji', 'Arsa temini', 'Nüfus artışının teşvik edilmesi'],
    answer: 4
  },
  {
    id: '2014-onlisans-gk-32',
    exam: 'KPSS Ön Lisans 2014 · Genel Kültür',
    q: 'Türkiye, nemlilik ve yağış bakımından incelendiğinde güney-kuzey ve doğu-batı yönünde farklılıklar görülür.\n\nBu farklılıkların nedenleri arasında aşağıdakilerden hangisi yer almaz?',
    options: ['Denizellik', 'Bitki örtüsü', 'Karasallık', 'Yükselti', 'Bakı'],
    answer: 1
  },
  {
    id: '2014-onlisans-gk-37',
    exam: 'KPSS Ön Lisans 2014 · Genel Kültür',
    q: 'Türkiye\'de yaşanan göçlerle ilgili olarak aşağıda verilenlerden hangisi yanlıştır?',
    options: [
      'Göç alan ve göç veren illerde, nüfusun cinsiyet oranı değişir.',
      'Göçler büyük şehirlere yönelmiştir.',
      'Göç eden nüfusun ekonomik düzeyi genel olarak düşüktür.',
      'Göçlerde şehirlerin çekiciliği yanında kırsal alanların iticiliği de etkilidir.',
      'Göçlerin çoğunluğu beyin göçü şeklindedir.'
    ],
    answer: 4
  },
  {
    id: '2014-lisans-gk-32',
    exam: 'KPSS Lisans 2014 · Genel Kültür',
    q: 'Türkiye\'deki bir meteoroloji istasyonundan alınan aylık yağış rejim grafiğinin (mm) değerleri şöyledir: Ocak 18, Şubat 22, Mart 29, Nisan 54, Mayıs 83, Haziran 90, Temmuz 71, Ağustos 55, Eylül 33, Ekim 41, Kasım 29, Aralık 25.\n\nBuna göre, bu grafik hangi yağış rejim tipine aittir?',
    options: ['Akdeniz yağış rejimi', 'Karadeniz yağış rejimi', 'İç Anadolu yarı karasal yağış rejimi', 'Doğu Anadolu karasal yağış rejimi', 'Akdeniz-Karadeniz geçiş yağış rejimi'],
    answer: 3
  },
  {
    id: '2014-lisans-gk-35',
    exam: 'KPSS Lisans 2014 · Genel Kültür',
    q: 'Üniversitede arkadaş olan dört öğrenci, yaşadıkları kentler ve bu kentlerin ekonomik faaliyetleri hakkında aşağıdaki bilgileri vermişlerdir.\n\nAyşen: Yaşadığım kent Türkiye\'nin en büyük maden kömürü havzasında yer alır.\nŞahin: Akdeniz Bölgesi\'nde bir kentte yaşıyorum. Kentteki en önemli sanayi kolu demir-çelik sektörüdür.\nAyhan: Benim yaşadığım kent kıyıdadır ve burada ham petrolü işleyen bir rafineri bulunmaktadır.\nBurak: Yaşadığım kentte Türkiye\'nin en küçük petrol rafinerisi bulunmaktadır. Rafineride işlenen petrol yöreden elde edilmektedir.\n\nBuna göre, aşağıdakilerden hangisi bu öğrencilerin yaşadıkları kentlerden biri değildir?',
    options: ['Zonguldak', 'İskenderun', 'Aliağa', 'Batman', 'Kırıkkale'],
    answer: 4
  },
  {
    id: '2015-lisans-gk-34',
    exam: 'KPSS Lisans 2015 · Genel Kültür',
    q: 'Aşağıdaki ova ve oluşum kökeni eşleştirmelerinden hangisi yanlıştır?',
    options: ['Elmalı – Karstik', 'Bafra – Delta', 'Nazilli – Tektonik', 'Merzifon – Tektonik', 'Ergene – Delta'],
    answer: 4
  },
  {
    id: '2015-lisans-gk-32',
    exam: 'KPSS Lisans 2015 · Genel Kültür',
    q: 'Türkiye kışın genellikle kuzey sektörlü soğuk ve nemli hava kütlelerinin, yazın ise güney sektörlü sıcak ve kuru hava kütlelerinin etkisinde kalır.\n\nBu durum Türkiye\'nin başlıca hangi özelliğinden kaynaklanmaktadır?',
    options: ['Orta kesimlerinde geniş düzlüklerin bulunmasından', 'Üç tarafının denizlerle çevrili olmasından', 'Kuzeyinde ve güneyinde yüksek dağ sıralarının bulunmasından', 'Ortalama yükseltisinin fazla olmasından', 'Mutlak konumundan'],
    answer: 4
  },
  {
    id: '2018-onlisans-gk-28',
    exam: 'KPSS Ön Lisans 2018 · Genel Kültür',
    q: 'Aşağıdaki haritada bazı alanlar numaralandırılarak koyu renkle gösterilmiştir.\n\nBu alanların hangilerinde buzul şekillerinin daha yaygın olarak görülmesi beklenir?',
    options: ['I ve II', 'I ve III', 'II ve IV', 'III ve V', 'IV ve V'],
    answer: 4,
    map: [
      { roman: 'I', lon: 27.946, lat: 41.546 },
      { roman: 'II', lon: 32.388, lat: 38.186 },
      { roman: 'III', lon: 34.715, lat: 39.966 },
      { roman: 'IV', lon: 41.057, lat: 40.747 },
      { roman: 'V', lon: 42.866, lat: 38.37 }
    ]
  },
  {
    id: '2022-lisans-gk-30',
    exam: 'KPSS Lisans 2022 · Genel Kültür',
    q: 'Aşağıdaki haritada bazı dağ sıraları numaralandırılarak gösterilmiştir.\n\nBu dağ sıralarının adları aşağıdakilerin hangisinde doğru olarak verilmiştir? (I - II - III sırasıyla)',
    options: ['Sultan - Ilgaz - Mercan', 'Ilgaz - Mercan - Sultan', 'Sultan - Mercan - Ilgaz', 'Mercan - Sultan - Ilgaz', 'Mercan - Ilgaz - Sultan'],
    answer: 0,
    map: [
      { roman: 'I', lon: 31.275, lat: 38.316 },
      { roman: 'II', lon: 33.946, lat: 41.06 },
      { roman: 'III', lon: 39.324, lat: 39.374 }
    ]
  },
  {
    id: '2021-lisans-gk-30',
    exam: 'KPSS Lisans 2021 · Genel Kültür',
    q: 'Türkiye\'nin bazı yüksek dağlarında buzul aşındırması ve biriktirmesi sonucunda oluşmuş yer şekillerine yaygın olarak rastlanır.\n\nHaritada numaralandırılan alanların hangilerinde bu yer şekilleri daha fazla görülür?',
    options: ['I ve II', 'I ve III', 'II ve IV', 'III ve V', 'IV ve V'],
    answer: 4,
    map: [
      { roman: 'I', lon: 27.051, lat: 39.881 },
      { roman: 'II', lon: 27.993, lat: 37.807 },
      { roman: 'III', lon: 33.115, lat: 41.439 },
      { roman: 'IV', lon: 40.687, lat: 40.624 },
      { roman: 'V', lon: 43.918, lat: 37.691 }
    ]
  },
  {
    id: '2021-lisans-gk-31',
    exam: 'KPSS Lisans 2021 · Genel Kültür',
    q: 'I. Tektonik hareketler\nII. Volkanik faaliyetler\nIII. Kimyasal ayrışma\nIV. Kayaç türü\n\nTürkiye\'de dağların geniş alanlar kaplamasında yukarıdakilerden hangileri daha fazla etkili olmuştur?',
    options: ['I ve II', 'I ve III', 'II ve III', 'II ve IV', 'III ve IV'],
    answer: 0
  },
  {
    id: '2021-lisans-gk-32',
    exam: 'KPSS Lisans 2021 · Genel Kültür',
    q: 'Vejetasyon dönemi, bitkilerin uykularından uyandıkları ve yaşam faaliyetlerini gerçekleştirdikleri dönemdir. Sıcaklıklar belli bir eşiği aştığında vejetasyon dönemi başlamakta, bu eşiğin altına düştüğünde ise sona ermektedir.\n\nAşağıdaki platoların hangisinde bu dönem daha kısadır?',
    options: ['Cihanbeyli', 'Şanlıurfa', 'Erzurum-Kars', 'Kırşehir', 'Çatalca-Kocaeli'],
    answer: 2
  },
  {
    id: '2021-lisans-gk-33',
    exam: 'KPSS Lisans 2021 · Genel Kültür',
    q: 'Aşağıdaki haritada bazı alanlar numaralandırılarak gösterilmiştir.\n\nBu alanların hangisinde Dalmaçya tipi kıyılar görülmektedir?',
    options: ['I', 'II', 'III', 'IV', 'V'],
    answer: 2,
    map: [
      { roman: 'I', lon: 26.986, lat: 38.885 },
      { roman: 'II', lon: 28.483, lat: 40.404 },
      { roman: 'III', lon: 29.918, lat: 36.273 },
      { roman: 'IV', lon: 35.442, lat: 36.703 },
      { roman: 'V', lon: 37.962, lat: 40.999 }
    ]
  },
  {
    id: '2020-onlisans-gk-31',
    exam: 'KPSS Ön Lisans 2020 · Genel Kültür',
    q: 'Aşağıdaki haritada bazı akarsular numaralandırılarak gösterilmiştir (I: kuzeybatıda kıyıya ulaşan akarsu, II: İç Anadolu\'da geniş bir kavis çizen akarsu, III: güneyde Akdeniz\'e dökülen akarsu).\n\nBu akarsular aşağıdakilerin hangisinde doğru olarak verilmiştir? (I - II - III sırasıyla)',
    options: ['Sakarya - Kızılırmak - Göksu', 'Susurluk - Kızılırmak - Seyhan', 'Sakarya - Yeşilırmak - Göksu', 'Filyos - Yeşilırmak - Seyhan', 'Sakarya - Filyos - Susurluk'],
    answer: 0,
    map: [
      { roman: 'I', lon: 30.5, lat: 40.25 },
      { roman: 'II', lon: 34.5, lat: 39.7 },
      { roman: 'III', lon: 33.3, lat: 36.7 }
    ]
  },
  {
    id: '2020-onlisans-gk-32',
    exam: 'KPSS Ön Lisans 2020 · Genel Kültür',
    q: 'Türkiye\'de aşağıdaki kıyı tiplerinden hangisi görülmez?',
    options: ['Ria tipi kıyı', 'Haliçli kıyı', 'Kalanklı kıyı', 'Dalmaçya tipi kıyı', 'Fiyortlu kıyı'],
    answer: 4
  },
  {
    id: '2020-onlisans-gk-33',
    exam: 'KPSS Ön Lisans 2020 · Genel Kültür',
    q: 'Türkiye\'de yağışın fazla, sıcaklıkların düşük, iğne ve geniş yapraklı ormanların bulunduğu yerlerde genellikle podzolik topraklar bulunur.\n\nBu topraklar aşağıdaki illerin hangisinde daha fazla yaygındır?',
    options: ['Rize', 'Edirne', 'Çanakkale', 'İzmir', 'Hatay'],
    answer: 0
  },
  {
    id: '2020-onlisans-gk-34',
    exam: 'KPSS Ön Lisans 2020 · Genel Kültür',
    q: 'Aşağıdaki ovalardan hangisinin oluşumunda etkili olan faktörler diğerlerinden farklıdır?',
    options: ['Çarşamba Ovası', 'Elmalı Ovası', 'Menemen Ovası', 'Silifke Ovası', 'Çukurova'],
    answer: 1
  },
  {
    id: '2020-onlisans-gk-35',
    exam: 'KPSS Ön Lisans 2020 · Genel Kültür',
    q: 'Türkiye nüfusunun yakın geleceğiyle ilgili olarak,\nI. Nüfus artış hızı azalacaktır.\nII. Ortanca yaş yükselecektir.\nIII. Genç nüfus oranı artacaktır.\nIV. Yaşlı nüfus oranı azalacaktır.\nyargılarından hangilerinin gerçekleşmesi beklenmektedir?',
    options: ['I ve II', 'I ve III', 'II ve III', 'II ve IV', 'III ve IV'],
    answer: 0
  },
  {
    id: '2020-onlisans-gk-36',
    exam: 'KPSS Ön Lisans 2020 · Genel Kültür',
    q: 'I. Yer altı kaynakları\nII. Sanayileşme\nIII. İklim şartları\n\nTürkiye\'de iç göçlerin ana hatlarıyla doğudan batıya doğru gerçekleşmesi, yukarıdakilerden hangileriyle ilişkilidir?',
    options: ['Yalnız I', 'Yalnız II', 'Yalnız III', 'I ve II', 'II ve III'],
    answer: 1
  },
  {
    id: '2020-onlisans-gk-37',
    exam: 'KPSS Ön Lisans 2020 · Genel Kültür',
    q: 'Türkiye\'de "dam ve kom" adıyla bilinen kırsal yerleşmelerde hâkim ekonomik faaliyet türü aşağıdakilerden hangisidir?',
    options: ['Arıcılık', 'Hayvancılık', 'Kültür balıkçılığı', 'Bağ ve bahçe tarımı', 'Tahıl tarımı'],
    answer: 1
  },
  {
    id: '2016-onlisans-gk-45',
    exam: 'KPSS Ön Lisans 2016 · Genel Kültür',
    q: 'Aşağıdaki haritada alternatif enerji üretiminin yapıldığı üç alan koyu renkle gösterilmiştir (Çanakkale/Biga, Aydın kıyıları ve İskenderun çevresi).\n\nBu alanlar Türkiye\'de aşağıdaki enerji kaynaklarından hangisiyle öne çıkmaktadır?',
    options: ['Dalga', 'Gel-git', 'Rüzgar', 'Jeotermal', 'Biyomas'],
    answer: 2,
    map: [
      { roman: 'I', lon: 26.757, lat: 39.894 },
      { roman: 'II', lon: 27.08, lat: 38.27 },
      { roman: 'III', lon: 36.23, lat: 36.58 }
    ]
  },
  {
    id: '2014-onlisans-gk-29',
    exam: 'KPSS Ön Lisans 2014 · Genel Kültür',
    q: 'Bir Türkiye fiziki haritası incelendiğinde Çukurova\'nın yeşil, Konya Ovası\'nın sarı, Erzurum Ovası\'nın kahverengi ile gösterilmesi aşağıdakilerin hangisiyle ilgilidir?',
    options: ['Bitki örtülerinin farklılığıyla', 'Eğim derecelerinin farklılığıyla', 'Yükseltilerinin farklılığıyla', 'Toprak türlerinin farklılığıyla', 'Jeolojik yapılarının farklılığıyla'],
    answer: 2
  },
  {
    id: '2014-onlisans-gk-31',
    exam: 'KPSS Ön Lisans 2014 · Genel Kültür',
    q: 'Aşağıdaki haritada, birbirinden farklı beş yöre numaralandırılarak koyu renkle gösterilmiştir.\n\nSıcaklığın düşmesiyle gerçekleşen don olayının bu yörelerin hangilerinde daha erken görülmesi beklenir?',
    options: ['I ve II', 'I ve IV', 'II ve III', 'III ve IV', 'III ve V'],
    answer: 3,
    map: [
      { roman: 'I', lon: 27.09, lat: 39.9 },
      { roman: 'II', lon: 29.0, lat: 36.8 },
      { roman: 'III', lon: 33.4, lat: 40.86 },
      { roman: 'IV', lon: 32.2, lat: 37.96 },
      { roman: 'V', lon: 36.9, lat: 39.35 }
    ]
  },
  {
    id: '2014-lisans-gk-43',
    exam: 'KPSS Lisans 2014 · Genel Kültür',
    q: 'Türkiye\'nin toplam enerji tüketimi içinde en büyük paya sahip olan yerli enerji kaynağı türü aşağıdakilerden hangisidir?',
    options: ['Taş kömürü', 'Linyit', 'Asfaltit', 'Petrol', 'Doğal gaz'],
    answer: 1
  },
  {
    id: '2014-lisans-gk-44',
    exam: 'KPSS Lisans 2014 · Genel Kültür',
    q: 'Aşağıdaki haritada farklı yer şekli özelliklerine sahip beş alan numaralandırılarak koyu renkle gösterilmiştir.\n\nBu alanların hangilerinde, demir yolu ulaşımının gelişmemesinde yer şekillerinin etkisi diğerlerinden daha fazladır?',
    options: ['I ve II', 'I ve III', 'II ve IV', 'II ve V', 'IV ve V'],
    answer: 4,
    map: [
      { roman: 'I', lon: 28.303, lat: 37.478 },
      { roman: 'II', lon: 33.689, lat: 41.633 },
      { roman: 'III', lon: 34.947, lat: 39.306 },
      { roman: 'IV', lon: 35.428, lat: 37.15 },
      { roman: 'V', lon: 43.622, lat: 37.704 }
    ]
  },
  {
    id: '2014-lisans-gk-45',
    exam: 'KPSS Lisans 2014 · Genel Kültür',
    q: 'I. Nüfus hareketleri\nII. Ticaret hacminin genişlemesi\nIII. Nüfus artış hızının yükselmesi\n\nTürkiye\'de yeni iş alanlarının ortaya çıkması sonucu yukarıdakilerin hangilerinde artış olması beklenir?',
    options: ['Yalnız I', 'Yalnız II', 'Yalnız III', 'I ve II', 'II ve III'],
    answer: 3
  },
  {
    id: '2024-lisans-gk-28',
    exam: 'KPSS Lisans 2024 · Genel Kültür',
    q: 'Türkiye\'nin coğrafi konumu ifade edilirken kuzey, güney, doğu ve batı yönlerindeki uç noktalarına da yer verilir.\n\nAşağıdakilerden hangisi bu uç noktalardan biri değildir?',
    options: ['Sinop - İnceburun', 'Dil Yöresi - Dilucu', 'Yayladağı - Topraktutan Köyü', 'Gökçeada - İnceburun', 'İzmir - Karaburun'],
    answer: 4
  },
  {
    id: '2024-lisans-gk-29',
    exam: 'KPSS Lisans 2024 · Genel Kültür',
    q: 'Üçüncü Jeolojik Zaman\'da, Toros Dağları\'nın oluşumunda aşağıdakilerden hangisi etkili olmuştur?',
    options: ['Alp orojenezi', 'Buzullaşma', 'Deniz seviyesi alçalması', 'Akarsu aşındırması', 'Dalga ve akıntılar'],
    answer: 0
  },
  {
    id: '2024-lisans-gk-30',
    exam: 'KPSS Lisans 2024 · Genel Kültür',
    q: 'Aşağıdaki haritada beş dağlık alan numaralandırılarak gösterilmiştir.\n\nBu alanların hangilerinde dağlık sahalar daha az yer kaplar?',
    options: ['I ve II', 'I ve V', 'II ve III', 'III ve IV', 'IV ve V'],
    answer: 2,
    map: [
      { roman: 'I', lon: 32.972, lat: 41.446 },
      { roman: 'II', lon: 34.954, lat: 38.601 },
      { roman: 'III', lon: 38.568, lat: 37.032 },
      { roman: 'IV', lon: 43.394, lat: 37.806 },
      { roman: 'V', lon: 40.913, lat: 40.255 }
    ]
  },
  {
    id: '2024-lisans-gk-31',
    exam: 'KPSS Lisans 2024 · Genel Kültür',
    q: 'Su ile temas ettiğinde çözünebilen kayaçların bulunduğu sahalarda karstik yeryüzü şekilleri gelişir. Bu şekillerin bir kısmı mağara veya yer altı boşluklarının tavanlarının çökmesiyle oluşur.\n\nBu şekilde oluşan yerşekillerine haritada numaralandırılan alanların hangisinde daha fazla rastlanır?',
    options: ['I', 'II', 'III', 'IV', 'V'],
    answer: 2,
    map: [
      { roman: 'I', lon: 27.663, lat: 41.473 },
      { roman: 'II', lon: 27.627, lat: 38.317 },
      { roman: 'III', lon: 33.248, lat: 37.914 },
      { roman: 'IV', lon: 39.323, lat: 40.599 },
      { roman: 'V', lon: 43.351, lat: 39.583 }
    ]
  },
  {
    id: '2024-lisans-gk-32',
    exam: 'KPSS Lisans 2024 · Genel Kültür',
    q: 'Bazı göller, vadilerin önlerinin birikinti yelpazesiyle (ya da heyelan/set oluşumuyla) tıkanması sonucunda oluşur.\n\nTürkiye\'de yer alan aşağıdaki göllerden hangisi bu şekilde oluşmuştur?',
    options: ['Van Gölü', 'Tuz Gölü', 'Terkos Gölü', 'Tortum Gölü', 'Mogan Gölü'],
    answer: 3
  },
  {
    id: '2024-lisans-gk-33',
    exam: 'KPSS Lisans 2024 · Genel Kültür',
    q: 'Aşağıdaki haritada, bir araştırma grubunun arazi gözlemi yaptığı bölge (güneybatı kıyı kesimi) kırmızı renkle gösterilmiştir.\n\nAşağıdakilerden hangisi araştırma grubunun bu bölgede görebileceği bitki formasyonlarından biri değildir?',
    options: ['Maki', 'Garig', 'Orman', 'Step', 'Psödomaki'],
    answer: 3
  },
  {
    id: '2024-lisans-gk-34',
    exam: 'KPSS Lisans 2024 · Genel Kültür',
    q: 'Aşağıdaki illerin hangisinde topraktaki kireç ve tuz birikiminin görülmesi beklenmez?',
    options: ['Yozgat', 'Rize', 'Konya', 'Aksaray', 'Şanlıurfa'],
    answer: 1
  },
  {
    id: '2024-lisans-gk-35',
    exam: 'KPSS Lisans 2024 · Genel Kültür',
    q: 'Türkiye\'de nüfusun coğrafi dağılışına ilişkin\nI. Yükseltiyle birlikte nüfus yoğunluğu da artar.\nII. Ülkenin batı yarısında nüfus yoğunluğu doğu yarısına oranla yüksektir.\nIII. Kıyı kesimleri iç kesimlere göre daha fazla nüfuslanmıştır.\nifadelerinden hangileri doğrudur?',
    options: ['Yalnız I', 'Yalnız II', 'Yalnız III', 'I ve II', 'II ve III'],
    answer: 4
  },
  {
    id: '2024-lisans-gk-37',
    exam: 'KPSS Lisans 2024 · Genel Kültür',
    q: 'Türkiye\'deki geleneksel kır yerleşmelerinde kullanılan mesken yapı malzemelerinden biri de volkanik kökenli kayaçlardır.\n\nAşağıdaki yörelerin hangisinde yapı malzemesi olarak bu kayaçların yaygın bir şekilde kullanıldığı meskenlere daha fazla rastlanır?',
    options: ['Taşeli Platosu', 'Erzurum-Kars Platosu', 'Tahtalı Dağları', 'Bozok Platosu', 'Ergene Havzası'],
    answer: 1
  },
  {
    id: '2024-lisans-gk-38',
    exam: 'KPSS Lisans 2024 · Genel Kültür',
    q: 'Aşağıdakilerden hangisi Türkiye\'deki linyit kömürü yataklarına sahip alanlardan biri değildir?',
    options: ['Soma', 'Amasra', 'Seyitömer', 'Tavşanlı', 'Elbistan'],
    answer: 1
  },
  {
    id: '2024-lisans-gk-39',
    exam: 'KPSS Lisans 2024 · Genel Kültür',
    q: 'I. Sivas - Erzincan - Kop Dağı\nII. Karaman - Konya - Tuz Gölü\nIII. Fethiye - Köyceğiz - Denizli\nIV. Çankırı - Kastamonu - Ilgaz Dağı\n\nYukarıdakilerin hangilerinde krom yatakları bulunmaktadır?',
    options: ['I ve II', 'I ve III', 'II ve III', 'II ve IV', 'III ve IV'],
    answer: 1
  },
  {
    id: '2024-lisans-gk-45',
    exam: 'KPSS Lisans 2024 · Genel Kültür',
    q: 'Aşağıdaki haritada beş alan numaralandırılarak gösterilmiştir.\n\nBu alanların hangisinde ayçiçeği üretim miktarı diğerlerinden daha azdır?',
    options: ['I', 'II', 'III', 'IV', 'V'],
    answer: 4,
    map: [
      { roman: 'I', lon: 28.345, lat: 39.859 },
      { roman: 'II', lon: 35.872, lat: 41.286 },
      { roman: 'III', lon: 32.428, lat: 38.097 },
      { roman: 'IV', lon: 39.871, lat: 37.61 },
      { roman: 'V', lon: 43.346, lat: 40.791 }
    ]
  },
  {
    id: '2024-onlisans-gk-41',
    exam: 'KPSS Ön Lisans 2024 · Genel Kültür',
    q: 'Aşağıdaki haritada bazı alanlar numaralandırılarak gösterilmiştir.\n\nBuna göre Türkiye\'nin UNESCO Dünya Kültür Mirası Listesi\'nde bulunan varlıklarından hangisinin bulunduğu alan yanlış gösterilmiştir?',
    options: ['I - Afrodisias', 'II - Bursa ve Cumalıkızık', 'III - Hattuşa', 'IV - Nemrut Dağı', 'V - Ani Arkeolojik Alanı'],
    answer: 3,
    map: [
      { roman: 'I', lon: 28.399, lat: 37.777 },
      { roman: 'II', lon: 29.051, lat: 39.952 },
      { roman: 'III', lon: 34.638, lat: 40.241 },
      { roman: 'IV', lon: 39.146, lat: 39.458 },
      { roman: 'V', lon: 43.181, lat: 40.653 }
    ]
  },
  {
    id: '2016-onlisans-gk-28',
    exam: 'KPSS Ön Lisans 2016 · Genel Kültür',
    q: 'Yükselti arttıkça sıcaklığın düşme oranı Karadeniz kıyı dağlarının kuzey yamaçlarında, güney yamaçlara oranla daha azdır.\n\nBu durum aşağıdakilerden hangisiyle ilgilidir?',
    options: ['Güney yamaçların daha sıcak olmasıyla', 'Güney yamaçlarda bitki örtüsünün daha seyrek olmasıyla', 'Kuzey yamaçların daha nemli olmasıyla', 'Kuzey yamaçlarda eğimin farklı olmasıyla', 'Kuzey yamaçlarda fön rüzgârlarının etkili olmasıyla'],
    answer: 2
  },
  {
    id: '2016-onlisans-gk-29',
    exam: 'KPSS Ön Lisans 2016 · Genel Kültür',
    q: 'Aşağıdakilerden hangisi karstik kökenli bir ova değildir?',
    options: ['Tercan', 'Muğla', 'Kestel', 'Elmalı', 'Suğla'],
    answer: 0
  },
  {
    id: '2016-onlisans-gk-30',
    exam: 'KPSS Ön Lisans 2016 · Genel Kültür',
    q: 'Karadeniz Bölgesi\'nde yaygın olarak görülen orman güllerinin Nur Dağları yamaçlarında, Akdeniz Flora Bölgesi\'ne ait Lübnan Sediri\'nin ise Erbaa-Niksar çevresinde yetişmesinin temel sebebi aşağıdakilerden hangisidir?',
    options: ['Toprak şartlarının bu alanlarda bitki isteğine uygun olması', 'Bu alanların, bitkilerin sıcaklık ve nem isteğine uygun olması', '4. Zaman iklim salınımları sırasında bu alanlara yayılmış olmaları', 'Bu alanlara ağaçlandırma çalışmalarıyla dikilmiş olmaları', 'Bu türlerin endemik bitkiler olması'],
    answer: 2
  },
  {
    id: '2016-onlisans-gk-31',
    exam: 'KPSS Ön Lisans 2016 · Genel Kültür',
    q: 'Türkiye\'de buzulların etkisiyle oluşmuş topografik şekillere ancak yüksek dağlık alanlarda rastlanmaktadır.\n\nBuna göre aşağıdakilerin hangisinde buzul şekillerine rastlanmaz?',
    options: ['Erciyes Dağı', 'Aladağlar', 'Uludağ', 'Kaçkar Dağı', 'Yıldız Dağları'],
    answer: 4
  },
  {
    id: '2016-onlisans-gk-32',
    exam: 'KPSS Ön Lisans 2016 · Genel Kültür',
    q: 'Aşağıdakilerden hangisi, Türkiye topraklarının tümü için en önemli sorundur?',
    options: ['Tuzluluk', 'Taşlılık', 'Erozyon', 'Kuraklık', 'Drenaj bozukluğu'],
    answer: 2
  },
  {
    id: '2016-onlisans-gk-33',
    exam: 'KPSS Ön Lisans 2016 · Genel Kültür',
    q: 'I. Ereğli Sazlığı\nII. Sultan Sazlığı\nIII. Hotamış Sazlığı\n\nYukarıdakilerin hangileri Konya Kapalı Havzası\'nda bulunan sulak alanlardan biri değildir?',
    options: ['Yalnız I', 'Yalnız II', 'Yalnız III', 'I ve II', 'II ve III'],
    answer: 1
  },
  {
    id: '2016-onlisans-gk-34',
    exam: 'KPSS Ön Lisans 2016 · Genel Kültür',
    q: 'Türkiye\'nin toprak özellikleriyle ilgili aşağıdakilerden hangisi doğrudur?',
    options: [
      'Karadeniz Bölgesi\'nin yüksek kesimlerindeki topraklarda podzollaşma görülür.',
      'En fazla yıkanmanın olduğu topraklar iç bölgelerdeki platolardadır.',
      'Akdeniz Bölgesi\'nin alçak kesimlerindeki topraklarda Terra Rossa oluşumu görülmez.',
      'Kuzeydoğu Anadolu platolarındaki topraklarda organik madde miktarı azdır.',
      'Tuz Gölü Havzası\'ndaki topraklarda bitki yetişmez.'
    ],
    answer: 0
  },
  {
    id: '2016-onlisans-gk-36',
    exam: 'KPSS Ön Lisans 2016 · Genel Kültür',
    q: 'Aşağıdaki illerden hangisinin Trakya Yarımadası\'nda toprakları bulunmamaktadır?',
    options: ['Balıkesir', 'Edirne', 'Kırklareli', 'Çanakkale', 'İstanbul'],
    answer: 0
  },
  {
    id: '2016-onlisans-gk-37',
    exam: 'KPSS Ön Lisans 2016 · Genel Kültür',
    q: 'I. Refah düzeyi\nII. Eğitim seviyesi\nIII. Nüfus yoğunluğu\n\nTürkiye\'nin batı ve doğu illeri arasındaki doğurganlık oranın farklı olmasında yukarıdakilerden hangileri etkilidir?',
    options: ['Yalnız I', 'Yalnız II', 'Yalnız III', 'I ve II', 'II ve III'],
    answer: 3
  },
  {
    id: '2016-onlisans-gk-39',
    exam: 'KPSS Ön Lisans 2016 · Genel Kültür',
    q: 'Türkiye\'de turizm, 1980\'lerden itibaren gelişme göstermeye ve bu doğrultuda turizm çeşitliliği son yıllarda artmaya başlamıştır.\n\nBuna göre Türkiye\'de\nI. ekoturizm,\nII. golf turizmi,\nIII. kültür turizmi,\nIV. deniz ve kıyı turizmi\ntürlerinden hangileri diğerlerine göre daha fazla turist çekmektedir?',
    options: ['I ve II', 'I ve III', 'II ve III', 'II ve IV', 'III ve IV'],
    answer: 4
  },
  {
    id: '2016-onlisans-gk-40',
    exam: 'KPSS Ön Lisans 2016 · Genel Kültür',
    q: 'Türkiye-Bulgaristan sınırında yer alır. Kara yolu ve demir yolu geçişi vardır. İşlek ve önemli bir gümrük kapısıdır.\n\nBazı özellikleri verilen bu sınır kapısı aşağıdakilerden hangisidir?',
    options: ['Cilvegözü', 'İpsala', 'Kapıkule', 'Gürbulak', 'Habur'],
    answer: 2
  },
  {
    id: '2016-onlisans-gk-41',
    exam: 'KPSS Ön Lisans 2016 · Genel Kültür',
    q: 'Türkiye\'de genellikle sanayi faaliyetlerinin yoğun olduğu kentlerde demir yolu ulaşımı bulunmaktadır.\n\nAşağıdaki kentlerden hangisi bu duruma uymamaktadır?',
    options: ['Kayseri', 'Manisa', 'Gaziantep', 'Mersin', 'Bursa'],
    answer: 4
  },
  {
    id: '2016-onlisans-gk-42',
    exam: 'KPSS Ön Lisans 2016 · Genel Kültür',
    q: 'Türkiye\'de bazı iller, sahip oldukları ham maddeler nedeniyle belirli sanayi dallarıyla özdeşleşmişlerdir.\n\nAşağıdakilerden hangisi buna örnek verilemez?',
    options: ['Kars - süt mamulleri', 'Eskişehir - meyve suyu üretimi', 'Çanakkale - konserve ürünler', 'Aydın - pamuklu dokuma', 'Konya - unlu mamuller'],
    answer: 1
  },
  {
    id: '2016-onlisans-gk-43',
    exam: 'KPSS Ön Lisans 2016 · Genel Kültür',
    q: 'I. Bakü-Tiflis-Ceyhan\nII. Mavi Akım\nIII. Kerkük-Yumurtalık\nIV. İran-Türkiye\nV. Yumurtalık-Kırıkkale\n\nYukarıda verilen boru hatlarının hangilerinde petrol taşımacılığı yapılmaktadır?',
    options: ['I ve II', 'I ve IV', 'I, III ve V', 'II, III ve IV', 'III, IV ve V'],
    answer: 2
  },
  {
    id: '2016-onlisans-gk-44',
    exam: 'KPSS Ön Lisans 2016 · Genel Kültür',
    q: 'Türkiye\'deki kırsal yerleşmelerde yaşayanlar, bulundukları bölgenin coğrafi özelliklerine göre farklı ekonomik faaliyetlerde bulunmaktadırlar.\n\nHaritada numaralandırılarak gösterilen kırsal alanların hangilerinde tarımsal ekonomik faaliyetler daha çok benzerlik gösterir?',
    options: ['I ve II', 'I ve III', 'I ve V', 'II ve III', 'III ve IV'],
    answer: 3,
    map: [
      { roman: 'I', lon: 27.729, lat: 37.495 },
      { roman: 'II', lon: 32.269, lat: 37.982 },
      { roman: 'III', lon: 39.079, lat: 37.412 },
      { roman: 'IV', lon: 41.61, lat: 41.375 },
      { roman: 'V', lon: 42.34, lat: 39.963 }
    ]
  },
  {
    id: '2018-onlisans-gk-29',
    exam: 'KPSS Ön Lisans 2018 · Genel Kültür',
    q: 'Türkiye\'nin iç kesimlerinde; bazı istasyonlarda yıllık ortalama sıcaklıkların batıdan doğuya doğru, Eskişehir\'de 10,6 C°, Sivas\'ta 9,1 C° ve Erzurum\'da ise 5,3 C° olduğu görülür.\n\nBu değişimde aşağıdakilerden hangisi daha fazla etkilidir?',
    options: ['Yükselti farkı', 'Enlem farkı', 'Rüzgar etkisi', 'Karasallık', 'Nem oranı'],
    answer: 0
  },
  {
    id: '2018-onlisans-gk-30',
    exam: 'KPSS Ön Lisans 2018 · Genel Kültür',
    q: 'I. Anadolu\'daki toprak çeşitliliği son derece fazladır.\nII. Anadolu aktif bir tektonik kuşakta yer alır.\nIII. Anadolu\'da çok sayıda uzun boylu akarsu yer alır.\nIV. Anadolu\'da genç volkanik alanlar bulunmaktadır.\n\n"Türkiye, termal su kaynakları bakımından zengindir." ifadesini kullanan bir kişi, yukarıdakilerden hangilerine dayanarak bu yargıya varmıştır?',
    options: ['I ve II', 'I ve III', 'II ve III', 'II ve IV', 'III ve IV'],
    answer: 3
  },
  {
    id: '2018-onlisans-gk-31',
    exam: 'KPSS Ön Lisans 2018 · Genel Kültür',
    q: 'Yağışın az, buharlaşmanın fazla olduğu bölgelerdeki toprakların yüzeyinde tuz ve kireç birikimleri görülür.\n\nBu durum, aşağıdaki yörelerin hangisinde daha fazla görülür?',
    options: ['Bursa çevresi', 'Muğla çevresi', 'Şanlıurfa çevresi', 'Kars çevresi', 'Bolu çevresi'],
    answer: 2
  },
  {
    id: '2018-onlisans-gk-32',
    exam: 'KPSS Ön Lisans 2018 · Genel Kültür',
    q: 'Günümüzde, Türkiye-Yunanistan kara sınırının büyük çoğunluğunu aşağıdaki akarsulardan hangisi oluşturur?',
    options: ['Asi', 'Meriç', 'Tunca', 'Aras', 'Çoruh'],
    answer: 1
  },
  {
    id: '2018-onlisans-gk-33',
    exam: 'KPSS Ön Lisans 2018 · Genel Kültür',
    q: 'Aşağıdaki il merkezlerinden hangisinin; konumu nedeniyle, Kuzey Anadolu Fay sisteminde meydana gelebilecek bir depremden daha fazla etkilenmesi beklenir?',
    options: ['Karaman', 'Denizli', 'Aksaray', 'Niğde', 'Amasya'],
    answer: 4
  },
  {
    id: '2018-onlisans-gk-34',
    exam: 'KPSS Ön Lisans 2018 · Genel Kültür',
    q: 'Aşağıdakilerden hangisi Türkiye\'nin mutlak konumunun etkisiyle ortaya çıkan özelliklerden biridir?',
    options: [
      'Karadeniz ve Akdeniz kıyısında dağların denize paralel uzanması',
      'Batıdan doğuya doğru ortalama yükseltinin artması',
      'Güneyden kuzeye doğru ortalama sıcaklığın azalması',
      'Nüfusun batı bölgelerinde yoğunlaşması',
      'Tarih boyunca medeniyetlere ev sahipliği yapması'
    ],
    answer: 2
  },
  {
    id: '2018-onlisans-gk-35',
    exam: 'KPSS Ön Lisans 2018 · Genel Kültür',
    q: 'Türkiye\'deki köy yerleşmelerini toplu ve dağınık yerleşmeler şeklinde gruplandırmak mümkündür.\n\nBuna göre, aşağıdaki illerin hangisinde dağınık dokulu köy yerleşmelerinin daha fazla olması beklenir?',
    options: ['Eskişehir', 'Yozgat', 'Gaziantep', 'Giresun', 'Nevşehir'],
    answer: 3
  },
  {
    id: '2018-onlisans-gk-36',
    exam: 'KPSS Ön Lisans 2018 · Genel Kültür',
    q: 'Türkiye\'de nüfusun göç yoluyla arttığı yerlerde genellikle erkek nüfus oranının fazla olduğu görülür.\n\nBu durum,\nI. eğitim,\nII. sağlık,\nIII. istihdam\nfaktörlerinden hangileriyle ilişkilidir?',
    options: ['Yalnız I', 'Yalnız II', 'Yalnız III', 'I ve II', 'II ve III'],
    answer: 2
  },
  {
    id: '2018-onlisans-gk-39',
    exam: 'KPSS Ön Lisans 2018 · Genel Kültür',
    q: 'Bazı sarp arazilerde tarımsal faaliyetler kısıtlıdır. Bu tür araziler daha çok ormancılık ve hayvancılık faaliyetleri için kullanılır.\n\nAşağıdaki illerin hangisinde bu duruma bağlı olarak tarımsal faaliyetlerin daha kısıtlı olması beklenir?',
    options: ['Konya', 'Trabzon', 'Sivas', 'Samsun', 'Bursa'],
    answer: 1
  },
  {
    id: '2018-onlisans-gk-41',
    exam: 'KPSS Ön Lisans 2018 · Genel Kültür',
    q: 'Doğal çevre koşullarına bağlı olarak ham madde temini kolaylığı açısından Türkiye\'de aşağıdaki sanayi kollarından hangisinin gelişme potansiyeli daha yüksektir?',
    options: ['Madeni eşya', 'Gıda', 'Petrokimya', 'Otomotiv', 'Elektronik'],
    answer: 1
  },
  {
    id: '2018-onlisans-gk-42',
    exam: 'KPSS Ön Lisans 2018 · Genel Kültür',
    q: 'Türkiye\'de geçmişten günümüze gelişen bir iç ticaret faaliyeti görülür.\n\nBu durumun oluşmasında;\nI. ülkede eğitim seviyesinin yükselmesi,\nII. şehirlerde yaşayan nüfusun artması,\nIII. ulaşım hizmetlerinin ülke genelinde gelişmesi,\nIV. ülkenin üç tarafının denizlerle çevrili olması\ngibi faktörlerden hangileri daha fazla etkili olmuştur?',
    options: ['I ve II', 'I ve III', 'II ve III', 'II ve IV', 'III ve IV'],
    answer: 2
  },
  {
    id: '2018-onlisans-gk-43',
    exam: 'KPSS Ön Lisans 2018 · Genel Kültür',
    q: 'İklim, bir tarımsal ürünün yetiştirilmesini ve çeşitliliğini belirleyen önemli faktörlerden biridir. Örneğin Türkiye\'de buğday; filizlenme ve büyüme dönemi olan ilkbahar aylarında yağış, olgunlaşma dönemi olan yaz aylarında ise kuraklık ister.\n\nAşağıdaki illerin hangisinde bu ürünün yetişmesi daha güçtür?',
    options: ['Sivas', 'Konya', 'Afyonkarahisar', 'Rize', 'Samsun'],
    answer: 3
  },
  {
    id: '2018-onlisans-gk-44',
    exam: 'KPSS Ön Lisans 2018 · Genel Kültür',
    q: 'Türkiye\'nin yeryüzü şekilleri göz önüne alındığında aşağıdaki illerden hangisinde kayak turizminin gelişmesi beklenmez?',
    options: ['Bursa', 'Kilis', 'Erzurum', 'Antalya', 'Bolu'],
    answer: 1
  },
  {
    id: '2018-onlisans-gk-40',
    exam: 'KPSS Ön Lisans 2018 · Genel Kültür',
    q: 'Aşağıdaki haritada bazı tarım ürünlerinin yoğun olarak yetiştirildiği yerler gösterilmiştir (K: Marmara kıyısı, L: İç Anadolu\'nun batısı, M: Doğu Karadeniz).\n\nK, L ve M ile gösterilen bu yerlerde hangi tarım ürünleri yoğun olarak yetiştirilir? (K - L - M sırasıyla)',
    options: ['Pirinç - Haşhaş - Çay', 'Çay - Haşhaş - Pirinç', 'Pirinç - Çay - Haşhaş', 'Çay - Pirinç - Haşhaş', 'Haşhaş - Pirinç - Çay'],
    answer: 0,
    map: [
      { roman: 'K', lon: 28.9, lat: 40.2 },
      { roman: 'L', lon: 30.6, lat: 38.75 },
      { roman: 'M', lon: 40.5, lat: 41.02 }
    ]
  }
];
