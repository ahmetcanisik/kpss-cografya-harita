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

// [ad, tür, boylam, enlem]
const MOUNTAINS = [
["Kaz Dağları","kirik",26.85,39.7,"horst"],["Madra Dağı","kirik",27.3,39.2,"horst"],["Yunt Dağı","kirik",27.55,38.75,"horst"],
["Bozdağlar","kirik",28.05,38.3,"horst"],["Aydın Dağları","kirik",27.95,37.65,"horst"],["Menteşe Dağları","kirik",28.35,37.1,"horst"],
["Nur (Amanos) Dağları","kirik",36.4,37.0,"horst"],
["Bakırçay Grabeni","kirik",27.2,39.1,"graben"],["Gediz Grabeni","kirik",28.15,38.48,"graben"],
["Küçük Menderes Grabeni","kirik",27.75,38.1,"graben"],["Büyük Menderes Grabeni","kirik",28.33,37.9,"graben"],
["Beydağları","kivrim",30.2,36.7],["Geyik Dağları","kivrim",32.3,36.85],["Bolkar Dağları","kivrim",34.55,37.35],
["Aladağlar","kivrim",35.2,37.85],["Munzur Dağları","kivrim",39.6,39.3],["Mercan Dağları","kivrim",40.1,39.75],
["Cudi Dağı","kivrim",42.2,37.35],["Hakkâri Dağları","kivrim",43.85,37.55],
["Köroğlu Dağları","kivrim",32.6,40.7],["Ilgaz Dağları","kivrim",33.75,41.05],["Küre Dağları","kivrim",33.7,41.65],
["Samanlı Dağları","kivrim",29.5,40.5],["Canik Dağları","kivrim",37.1,40.55],["Kaçkar Dağları","kivrim",41.15,40.85],["Yalnızçam Dağları","kivrim",42.55,41.1],
["Allahuekber Dağları","kivrim",42.4,40.4],["Palandöken Dağları","kivrim",41.3,39.75],
["Ağrı Dağı","volkanik",44.3,39.7],["Tendürek Dağı","volkanik",43.85,39.35],["Süphan Dağı","volkanik",42.83,38.93],
["Nemrut Dağı","volkanik",42.23,38.65],["Bingöl Dağı","volkanik",40.55,39.35],["Karacadağ","volkanik",39.85,37.72],
["Erciyes Dağı","volkanik",35.45,38.53],["Hasan Dağı","volkanik",34.17,38.13],["Melendiz Dağı","volkanik",34.6,38.25],
["Karadağ (Karaman)","volkanik",33.1,37.4],["Kula Volkanları","volkanik",28.65,38.55]
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

// [ad, bölge, boylam, enlem, rx, ry (enlem derecesi), açı, şehirler]
const OVA = [
["Çukurova","Akdeniz Bölgesi",35.3,37.0,0.6,0.35,0,["Adana","Mersin"]],
["Amik Ovası","Akdeniz Bölgesi",36.35,36.4,0.3,0.2,0,["Hatay"]],
["Antalya Ovası","Akdeniz Bölgesi",30.7,36.95,0.35,0.25,0,["Antalya"]],
["Bafra Ovası","Karadeniz Bölgesi",35.95,41.6,0.3,0.2,0,["Samsun"]],
["Çarşamba Ovası","Karadeniz Bölgesi",36.7,41.2,0.25,0.2,0,["Samsun"]],
["Harran Ovası","Güneydoğu Anadolu Bölgesi",39.0,36.85,0.55,0.3,0,["Şanlıurfa"]],
["Bursa Ovası","Marmara Bölgesi",29.1,40.2,0.3,0.2,0,["Bursa"]],
["Ergene (Trakya) Ovası","Marmara Bölgesi",27.4,41.3,0.8,0.45,0,["Edirne","Kırklareli","Tekirdağ"]],
["Adapazarı Ovası","Marmara Bölgesi",30.5,40.75,0.45,0.2,0,["Sakarya"]],
["Erzurum Ovası","Doğu Anadolu Bölgesi",41.3,39.95,0.3,0.2,0,["Erzurum"]],
["Muş Ovası","Doğu Anadolu Bölgesi",41.5,38.85,0.4,0.2,0,["Muş"]],
["Iğdır Ovası","Doğu Anadolu Bölgesi",44.1,39.95,0.3,0.2,0,["Iğdır"]],
["Malatya Ovası","Doğu Anadolu Bölgesi",38.3,38.4,0.3,0.2,0,["Malatya"]],
["Erzincan Ovası","Doğu Anadolu Bölgesi",39.5,39.75,0.35,0.15,0,["Erzincan"]],
["Bakırçay Ovası","Ege Bölgesi",27.2,39.1,0.3,0.2,0,["İzmir"]],
["Gediz Ovası","Ege Bölgesi",27.8,38.55,0.4,0.15,0,["Manisa"]],
["Küçük Menderes Ovası","Ege Bölgesi",27.75,38.1,0.3,0.12,0,["İzmir"]],
["Büyük Menderes Ovası","Ege Bölgesi",27.9,37.85,0.5,0.15,0,["Aydın"]],
["Konya Ovası","İç Anadolu Bölgesi",32.6,37.7,1.1,0.6,0,["Konya","Karaman"]]
];
const PLATO = [
["Haymana Platosu","İç Anadolu Bölgesi",32.4,39.4,0.5,0.35,0,["Ankara"]],
["Cihanbeyli Platosu","İç Anadolu Bölgesi",32.9,38.75,0.5,0.3,0,["Konya"]],
["Obruk Platosu","İç Anadolu Bölgesi",33.4,38.15,0.4,0.3,0,["Konya","Aksaray"]],
["Uzunyayla Platosu","İç Anadolu Bölgesi",36.4,38.75,0.6,0.3,0,["Kayseri","Sivas"]],
["Bozok Platosu","İç Anadolu Bölgesi",35.0,39.7,0.6,0.4,0,["Yozgat","Çorum"]],
["Eskişehir Platosu","İç Anadolu Bölgesi",30.8,39.55,0.6,0.3,0,["Eskişehir"]],
["Teke Platosu","Akdeniz Bölgesi",30.1,37.2,0.5,0.35,0,["Antalya","Burdur"]],
["Kars Platosu","Doğu Anadolu Bölgesi",43.0,40.6,0.6,0.35,0,["Kars","Ardahan"]],
["Gaziantep Platosu","Güneydoğu Anadolu Bölgesi",37.5,37.0,0.4,0.25,0,["Gaziantep"]],
["Mardin Eşiği (Platosu)","Güneydoğu Anadolu Bölgesi",40.8,37.35,0.5,0.25,0,["Mardin"]],
["Ceylanpınar Platosu","Güneydoğu Anadolu Bölgesi",40.1,36.9,0.5,0.2,0,["Şanlıurfa"]]
];
const MASIF = [
["Menderes Masifi","Ege Bölgesi",28.6,38.05,1.0,0.48,-8],
["Kazdağ Masifi","Marmara Bölgesi",27.1,39.7,0.38,0.24,-20],
["Uludağ Masifi","Marmara Bölgesi",29.15,40.05,0.4,0.25,0],
["Istranca (Yıldız) Masifi","Marmara Bölgesi",27.95,41.75,0.6,0.17,-22],
["Zonguldak Masifi","Karadeniz Bölgesi",31.8,41.35,0.42,0.2,-10],
["Kırşehir Masifi","İç Anadolu Bölgesi",34.0,39.2,1.3,0.7,0],
["Sultan Dağları Masifi","İç Anadolu Bölgesi",31.2,38.3,0.55,0.18,-12],
["Niğde Masifi","İç Anadolu Bölgesi",34.75,37.85,0.5,0.4,0],
["Alanya-Anamur Masifi","Akdeniz Bölgesi",32.0,36.25,0.6,0.18,-8],
["Malatya-Pötürge Masifi","Doğu Anadolu Bölgesi",38.7,38.25,0.55,0.22,-12],
["Mardin-Derik Masifi","Güneydoğu Anadolu Bölgesi",40.2,37.25,0.48,0.18,-8],
["Bitlis Masifi","Doğu Anadolu Bölgesi",42.2,38.2,1.0,0.4,-15]
];
const PLATES = [["Avrasya Levhası",31.5,43.15],["Anadolu Levhası",32.5,38.55],["Arap Levhası",39.6,35.4],["Afrika Levhası",29.5,34.5],["Ege Levhası",26.3,36.55]];
const SEAS = [["Karadeniz",35.0,42.55],["Ege Denizi",25.2,38.9],["Akdeniz",33.0,35.3],["Marmara Denizi",28.1,40.72]];

// Yaklaşık göl alanları (gerçek poligon verisi bulunamayanlar için elips)
const LAKES_APPROX = [
["İznik Gölü","Marmara Bölgesi",29.52,40.43,0.09,0.045,-10],
["Sapanca Gölü","Marmara Bölgesi",30.27,40.70,0.045,0.022,-15],
["Manyas (Kuş) Gölü","Marmara Bölgesi",27.97,40.18,0.06,0.045,0],
["Uluabat Gölü","Marmara Bölgesi",28.58,40.17,0.08,0.035,-5],
["Salda Gölü","Akdeniz Bölgesi",29.68,37.55,0.035,0.03,0],
["Acıgöl (Denizli)","Ege Bölgesi",29.48,37.98,0.045,0.025,-10],
["Burdur Gölü","Akdeniz Bölgesi",30.18,37.72,0.07,0.03,-10],
["Akşehir Gölü","İç Anadolu Bölgesi",31.42,38.38,0.14,0.045,-8],
["Eber Gölü","İç Anadolu Bölgesi",31.15,38.58,0.065,0.035,-5],
["Çıldır Gölü","Doğu Anadolu Bölgesi",43.15,41.13,0.065,0.05,0],
["Hazar Gölü","Doğu Anadolu Bölgesi",39.75,38.48,0.045,0.025,-10],
["Erçek Gölü","Doğu Anadolu Bölgesi",43.62,38.65,0.05,0.03,0],
["Kovada Gölü","Akdeniz Bölgesi",30.87,37.83,0.02,0.02,0]
];
