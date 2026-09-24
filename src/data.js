const CITY = {
"Ankara":[32.86,39.93],"Konya":[32.48,37.87],"Karaman":[33.22,37.18],"Aksaray":[34.03,38.37],"Kayseri":[35.49,38.72],
"Sivas":[37.02,39.75],"Yozgat":[34.81,39.82],"Çorum":[34.95,40.55],"Kars":[43.09,40.6],"Ardahan":[42.7,41.11],
"Gaziantep":[37.38,37.06],"Mardin":[40.74,37.31],"Şanlıurfa":[38.79,37.16],"Eskişehir":[30.52,39.77],"Antalya":[30.71,36.9],
"Burdur":[30.29,37.72],"İzmir":[27.14,38.42],"Manisa":[27.43,38.61],"Aydın":[27.84,37.85],"Erzurum":[41.27,39.9],
"Muş":[41.5,38.74],"Iğdır":[44.04,39.92],"Malatya":[38.31,38.35],"Erzincan":[39.49,39.75],"Samsun":[36.33,41.29],
"Bursa":[29.06,40.19],"Edirne":[26.56,41.68],"Tekirdağ":[27.51,40.98],"Kırklareli":[27.22,41.73],"Adana":[35.32,37.0],
"Mersin":[34.64,36.81],"Hatay":[36.16,36.2],"Sakarya":[30.4,40.78],"Karlıova":[41.01,39.3],"Niksar":[36.97,40.59],
"Erbaa":[36.57,40.7],"Havza":[35.67,40.97],"Osmancık":[34.8,40.98],"Ilgaz":[33.63,40.92],"Gerede":[32.2,40.8],
"Bolu":[31.6,40.73],"Düzce":[31.16,40.84],"İzmit":[29.92,40.77],"Gemlik":[29.15,40.43],"Şarköy":[27.1,40.61],
"Bingöl":[40.5,38.88],"Elazığ":[39.22,38.68],"Adıyaman":[38.28,37.76],"Kahramanmaraş":[36.93,37.58],
"Alaşehir":[28.5,38.35],"Salihli":[28.14,38.48],"Denizli":[29.09,37.78],"Nazilli":[28.33,37.91],"Söke":[27.4,37.75],
"Ödemiş":[27.97,38.23],"Tire":[27.73,38.09],"Selçuk":[27.37,37.95],"Fethiye":[29.12,36.62],"Acıpayam":[29.34,37.42],
"Şereflikoçhisar":[33.54,38.94],"Pozantı":[34.87,37.43],"Çamardı":[34.98,37.83],"Yahyalı":[35.35,38.1]
};

// Volkanik dağlar (kitap s.57): [ad, boylam, enlem]
const VOLCANOES = [
["Ağrı Dağı",44.3,39.7],["Tendürek Dağı",43.85,39.35],["Süphan Dağı",42.83,38.93],["Nemrut Dağı",42.23,38.65],
["Bingöl Dağı",40.55,39.35],["Karacadağ (Şanlıurfa)",39.83,37.67],["Erciyes Dağı",35.45,38.53],["Hasan Dağı",34.17,38.13],
["Melendiz Dağı",34.6,38.25],["Karacadağ (Konya)",33.6,37.8],["Karadağ (Karaman)",33.1,37.4],["Kula Volkanları",28.65,38.55]
];
// Kırık dağlar (horstlar) çizgi olarak, kitap s.57 şemasına göre: {ad, çizgiler}
const HORSTS = [
{name:"Kaz Dağları",lines:[[[26.75,39.68],[27.25,39.78]]]},
{name:"Madra Dağı",lines:[[[27.05,39.28],[27.55,39.42]]]},
{name:"Yunt Dağı",lines:[[[27.2,38.8],[27.62,38.96]]]},
{name:"Bozdağlar",lines:[[[27.7,38.3],[28.1,38.34],[28.45,38.33]]]},
{name:"Aydın Dağları",lines:[[[27.6,37.95],[28.05,38.0],[28.5,38.05]]]},
{name:"Menteşe Dağları",lines:[[[27.7,37.55],[28.0,37.3]],[[28.2,37.6],[28.4,37.3]],[[28.5,37.65],[28.9,37.45]],[[28.85,37.75],[29.3,37.65]]]},
{name:"Nur (Amanos) Dağları",lines:[[[36.12,36.45],[36.35,36.9],[36.55,37.25]]]}
];
// Ege grabenleri (ters üçgen): [ad, boylam, enlem]
const GRABENS = [["Bakırçay Grabeni",27.2,39.1],["Gediz Grabeni",28.15,38.48],["Küçük Menderes Grabeni",27.75,38.1],["Büyük Menderes Grabeni",28.33,37.9]];
// Kitap kıvrım dağı haritasında (s.55) çizilmemiş ama KPSS'de geçen kıvrım dağları
const FOLDS_EXTRA = [
{name:"Munzur Dağları",lines:[[[38.9,39.35],[39.6,39.25],[40.2,39.15]]],extra:true},
{name:"Cudi Dağı",lines:[[[42.0,37.33],[42.5,37.45]]],extra:true}
];

// Fay hatları: çizgi üzerinde isim yazılmaz; şehirler gösterilir
const FAULTS = [
{name:"Kuzey Anadolu Fay Hattı",pts:[[41.0,39.3],[40.2,39.58],[39.5,39.75],[38.6,40.05],[37.4,40.4],[36.97,40.59],[36.57,40.7],[36.0,40.85],[35.67,40.97],[34.8,40.98],[33.63,40.92],[32.9,40.8],[32.2,40.8],[31.6,40.73],[31.16,40.84],[30.4,40.78],[29.92,40.77],[29.15,40.5],[28.4,40.8],[27.6,40.78],[27.1,40.62],[26.4,40.5]],cities:["Karlıova","Erzincan","Niksar","Erbaa","Havza","Osmancık","Ilgaz","Gerede","Bolu","Düzce","Sakarya","İzmit","Gemlik","Şarköy"]},
{name:"Doğu Anadolu Fay Hattı",pts:[[41.0,39.3],[40.5,38.9],[39.95,38.7],[39.31,38.45],[38.7,38.2],[38.25,38.0],[37.65,37.78],[37.3,37.48],[36.85,37.35],[36.55,36.95],[36.2,36.4],[36.1,36.1]],cities:["Bingöl","Elazığ","Malatya","Adıyaman","Kahramanmaraş","Hatay"]},
{name:"Gediz Grabeni Fayı",pts:[[28.6,38.35],[28.15,38.48],[27.6,38.58],[27.25,38.6]],cities:["Alaşehir","Salihli","Manisa"]},
{name:"Büyük Menderes Grabeni Fayı",pts:[[29.1,37.8],[28.33,37.9],[27.85,37.85],[27.4,37.75]],cities:["Denizli","Nazilli","Aydın","Söke"]},
{name:"Küçük Menderes Grabeni Fayı",pts:[[28.0,38.25],[27.75,38.1],[27.4,37.95]],cities:["Ödemiş","Tire","Selçuk"]},
{name:"Fethiye–Burdur Fay Zonu",pts:[[29.12,36.62],[29.3,37.1],[29.34,37.42],[30.29,37.72]],cities:["Fethiye","Acıpayam","Burdur"]},
{name:"Tuz Gölü Fayı",pts:[[33.54,38.94],[33.8,38.55],[34.03,38.37],[34.4,37.95]],cities:["Şereflikoçhisar","Aksaray"]},
{name:"Ecemiş Fayı",pts:[[34.87,37.43],[35.0,37.85],[35.35,38.1],[35.6,38.5]],cities:["Pozantı","Çamardı","Yahyalı"]}
];

// Ova ve plato türleri (kitap s.60-67)
const PLAIN_TYPES = {delta:["Delta ovaları","#4FA06A"],tektonik:["Tektonik ovalar","#B06FB3"],karstik:["Karstik ovalar (polyeler)","#9C9CC4"],eskigol:["Eski göl tabanı ovaları","#8E5A9E"],lav:["Lav örtüsü ovaları","#E0655A"],dagetegi:["Dağ eteği ovaları","#6F9B45"]};
const PLATEAU_TYPES = {asinim:["Aşınım düzlüğü platoları","#3E7FA6"],karstik:["Karstik platolar","#8F8F99"],lav:["Lav platoları","#E8706C"],tuf:["Tüf platosu","#3B3A40"],yatay:["Yatay duruşlu tabaka düzlüğü platoları","#A56BC4"]};

const PLATES = [["Avrasya Levhası",31.5,43.15],["Anadolu Levhası",32.5,38.55],["Arap Levhası",39.6,35.4],["Afrika Levhası",29.5,34.5],["Ege Levhası",26.3,36.55]];
const SEAS = [["Karadeniz",35.0,42.55],["Ege Denizi",25.2,38.9],["Akdeniz",33.0,35.3],["Marmara Denizi",28.1,40.72]];

// Akarsu bilgileri (kitap s.92-94). Geometri: geo.json → osm.rivers (OpenStreetMap)
// ad: [tür (nehir|kol|sinir), havza, sınır oluşturduğu ülkeler]
const RIVER_META = {
"Kızılırmak":["nehir","Karadeniz"],"Yeşilırmak":["nehir","Karadeniz"],"Sakarya":["nehir","Karadeniz"],
"Filyos (Yenice)":["nehir","Karadeniz"],"Çoruh":["nehir","Karadeniz"],"Fırat":["nehir","Basra Körfezi"],
"Dicle":["nehir","Basra Körfezi","Türkiye–Suriye"],"Aras":["nehir","Hazar","Türkiye–Ermenistan–Nahçıvan"],
"Kura":["nehir","Hazar"],"Meriç":["nehir","Ege","Türkiye–Yunanistan"],"Ergene":["kol","Ege (Meriç kolu)"],
"Susurluk (Simav)":["nehir","Marmara"],"Bakırçay":["nehir","Ege"],"Gediz":["nehir","Ege"],
"Küçük Menderes":["nehir","Ege"],"Büyük Menderes":["nehir","Ege"],"Dalaman Çayı":["nehir","Akdeniz"],
"Eşen Çayı":["nehir","Akdeniz"],"Aksu Çayı":["nehir","Akdeniz"],"Köprüçay":["nehir","Akdeniz"],
"Manavgat Çayı":["nehir","Akdeniz"],"Göksu (Silifke)":["nehir","Akdeniz"],"Seyhan":["nehir","Akdeniz"],
"Ceyhan":["nehir","Akdeniz"],"Asi":["nehir","Akdeniz","Türkiye–Suriye"],
"Porsuk Çayı":["kol","Sakarya kolu"],"Devrez Çayı":["kol","Kızılırmak kolu"],"Kelkit Çayı":["kol","Yeşilırmak kolu"],
"Karasu (Fırat kolu)":["kol","Fırat kolu"],"Murat":["kol","Fırat kolu"],"Zap Suyu":["kol","Dicle kolu"],
"Harşit Çayı":["kol","Karadeniz"],"Delice Irmağı":["kol","Kızılırmak kolu"],"Gönen Çayı":["kol","Marmara"],
"Bartın Çayı":["kol","Karadeniz"],
"Tunca":["sinir","Meriç kolu","Türkiye–Bulgaristan"],"Mutludere":["sinir","Karadeniz","Türkiye–Bulgaristan"],
"Arpaçay":["sinir","Aras kolu","Türkiye–Ermenistan"],"Hezil Çayı":["sinir","Dicle kolu","Türkiye–Irak"]
};

// Göl oluşum türleri (kitap s.96-101). Geometri: geo.json → osm.lakes
const LAKE_TYPES = {tektonik:"Tektonik göl",volkanik:"Volkanik göl",karstik:"Karstik göl",karma:"Karma oluşumlu göl",heyelan:"Heyelan set gölü",aluvyal:"Alüvyal set gölü",lav:"Lav set gölü",kiyi:"Kıyı set gölü (lagün)",traverten:"Traverten set gölü"};
const LAKE_META = {
"Van Gölü":"karma","Tuz Gölü":"tektonik","Seyfe Gölü":"tektonik","Aktaş Gölü":"tektonik","Hazar Gölü":"tektonik",
"Manyas (Kuş) Gölü":"tektonik","Uluabat Gölü":"tektonik","İznik Gölü":"tektonik","Burdur Gölü":"tektonik",
"Sapanca Gölü":"tektonik","Eber Gölü":"tektonik","Akşehir Gölü":"tektonik","Acıgöl (Denizli)":"tektonik",
"Nemrut Krater Gölü":"volkanik","Meke Gölü":"volkanik","Acıgöl (Karapınar)":"volkanik",
"Salda Gölü":"karstik","Avlan Gölü":"karstik","Kızören Obruğu":"karstik","Hafik Gölü":"karstik","Tödürge Gölü":"karstik",
"Eğirdir Gölü":"karma","Kovada Gölü":"karma","Beyşehir Gölü":"karma","Suğla Gölü":"karma",
"Abant Gölü":"heyelan","Yedigöller":"heyelan","Borabay Gölü":"heyelan","Zinav Gölü":"heyelan","Sera Gölü":"heyelan","Tortum Gölü":"heyelan",
"Uzungöl":"aluvyal","Mogan Gölü":"aluvyal","Eymir Gölü":"aluvyal","Marmara Gölü":"aluvyal","Bafa Gölü":"aluvyal","Köyceğiz Gölü":"aluvyal",
"Çıldır Gölü":"lav","Balık Gölü":"lav","Haçlı Gölü":"lav","Nazik Gölü":"lav","Erçek Gölü":"lav",
"Terkos (Durusu) Gölü":"kiyi","Büyükçekmece Gölü":"kiyi","Küçükçekmece Gölü":"kiyi","Ölüdeniz":"kiyi",
"Akyatan Lagünü":"kiyi","Yumurtalık Lagünü":"kiyi","Akgöl (Göksu Deltası)":"kiyi","Otlukbeli Gölü":"traverten"
};

// Barajlar (kitap s.102): ad -> [akarsu, en büyük 10 içindeki sırası (0 = listede yok)]
const DAM_META = {
"Atatürk Barajı":["Fırat",1],"Karakaya Barajı":["Fırat",2],"Keban Barajı":["Fırat",3],"Ilısu Barajı":["Dicle",4],
"Altınkaya Barajı":["Kızılırmak",5],"Birecik Barajı":["Fırat",6],"Deriner Barajı":["Çoruh",7],"Oymapınar Barajı":["Manavgat",8],
"Berke Barajı":["Ceyhan",9],"Ermenek Barajı":["Göksu",10],"Gökçekaya Barajı":["Sakarya",0],"Sarıyar Barajı":["Sakarya",0],
"Hirfanlı Barajı":["Kızılırmak",0],"Almus Barajı":["Yeşilırmak",0],"Yusufeli Barajı":["Çoruh",0],"Demirköprü Barajı":["Gediz",0],
"Adıgüzel Barajı":["Büyük Menderes",0],"Kemer Barajı":["Akçay (Büyük Menderes kolu)",0],"Manavgat Barajı":["Manavgat",0],
"Çatalan Barajı":["Seyhan",0],"Aslantaş Barajı":["Ceyhan",0]
};
