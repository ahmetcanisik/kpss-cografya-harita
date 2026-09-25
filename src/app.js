const REG={cx:(35.5-24.3)*77.7,cy:(43.6-39.0)*100,w:(46.6-24.4)*77.7,h:7.4*100};
const LON0=24.3, LAT1=43.6, KX=77.7, KY=100;
const P=(lon,lat)=>[(lon-LON0)*KX,(LAT1-lat)*KY];
const invP=(x,y)=>[x/KX+LON0, LAT1-y/KY];
function distKm(lon1,lat1,lon2,lat2){
  const R=6371, la=(lat1+lat2)/2*Math.PI/180;
  const x=(lon2-lon1)*Math.PI/180*Math.cos(la), y=(lat2-lat1)*Math.PI/180;
  return Math.sqrt(x*x+y*y)*R;
}
const BOOK=GEO.book||{}, OSM=GEO.osm||{};
const REGION_GEO = REGIONS.map(([full,key,color])=>{
  const meta = GEO.regionMeta[key];
  const [cx,cy] = P(meta.lon, meta.lat);
  return {full,key,color,lon:meta.lon,lat:meta.lat,cx,cy,cities:BOLGE_ILLER[key]};
});

const C={kirik:'#A67C00',kivrim:'#7B4A1E',volkanik:'#C62828',fay:'#D32F2F',masif:'#6B4424',levha:'#3F5E78',sea:'#4B7086',city:'#22303B',goller:'#1F6E96',nehirler:'#1769AA',akarsular:'#3287B8',sinir:'#E07B00',barajlar:'#0D4F7A',komsu:'#385565'};
const state={on:{kirik:true,kivrim:true,volkanik:true,fay:false,ova:false,plato:false,masif:false,nehirler:false,akarsular:false,sinir:false,goller:false,barajlar:false,havza:false,toprak:false,deprem:false,bolge:false,iller:false,komsu:false,levha:false},cities:true,provNames:true,k:1,tx:0,ty:0};
/* ---------- açılışta rastgele katmanlar ----------
   1 katman %30, 2 katman %45, 3 katman %25. Aynı gruptan en fazla "max" kadar katman seçilir ki
   harita okunur kalsın (örn. iki zemin dolgusu üst üste binmesin). Önceki açılışın kombinasyonu
   tekrar etmesin diye localStorage'da tutulur. */
const RANDOM_GROUPS=[
  {max:1,ls:['toprak','deprem','havza','bolge','iller']}, // zemin dolguları
  {max:1,ls:['ova','plato','masif']},                     // alanlar
  {max:1,ls:['nehirler','akarsular','sinir']},            // su çizgileri
  {max:2,ls:['kirik','kivrim','volkanik','fay']},         // dağlar ve faylar
  {max:3,ls:['goller','barajlar','komsu']}                // serbest
];
const store={get(k){try{return localStorage.getItem(k);}catch(_){return null;}},set(k,v){try{localStorage.setItem(k,v);return true;}catch(_){return false;}}};
function pickRandomLayers(){
  const prev=store.get('kpss-last-layers');let pick=[];
  for(let tries=0;tries<10;tries++){
    const r=Math.random(),n=r<.3?1:r<.75?2:3;
    const cand=RANDOM_GROUPS.flatMap(g=>g.ls);
    for(let i=cand.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[cand[i],cand[j]]=[cand[j],cand[i]];}
    const used=new Map();pick=[];
    for(const l of cand){if(pick.length>=n)break;const g=RANDOM_GROUPS.find(g=>g.ls.includes(l));
      if((used.get(g)||0)>=g.max)continue;used.set(g,(used.get(g)||0)+1);pick.push(l);}
    if(pick.slice().sort().join()!==prev)break;
  }
  store.set('kpss-last-layers',pick.slice().sort().join());
  return pick;
}
Object.keys(state.on).forEach(k=>state.on[k]=false);
pickRandomLayers().forEach(l=>state.on[l]=true);
const svg=document.getElementById('map'), world=document.getElementById('world'), over=document.getElementById('over'), note=document.getElementById('note');
let W=800,H=600,fit=1;
const ctx=document.createElement('canvas').getContext('2d');
const wcache={};
function tw(t,size,weight,italic,ls){const key=t+size+weight+italic+ls;if(wcache[key]!==undefined)return wcache[key];ctx.font=`${italic?'italic ':''}${weight} ${size}px "Instrument Sans", system-ui, sans-serif`;return wcache[key]=ctx.measureText(t).width+(ls||0)*t.length;}
const S=()=>fit*state.k;
const sx=(x)=>x*S()+state.tx, sy=(y)=>y*S()+state.ty;
const screenToWorld=(cx,cy)=>[(cx-state.tx)/S(),(cy-state.ty)/S()];
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');}

/* ---------- öğe modeli ---------- */
// Her öğe: {layer, name, sub, group, color, kind:'point'|'line'|'area', d (dünya koordinatında SVG path), wx, wy (etiket noktası), box}
const toD=pts=>'M'+pts.map(p=>P(p[0],p[1]).map(v=>v.toFixed(1)).join(',')).join('L');
function boxOfD(d){let x1=1e9,y1=1e9,x2=-1e9,y2=-1e9;const n=d.match(/-?\d+(\.\d+)?/g)||[];
  for(let i=0;i+1<n.length;i+=2){const x=+n[i],y=+n[i+1];if(x<x1)x1=x;if(x>x2)x2=x;if(y<y1)y1=y;if(y>y2)y2=y;}return [x1,y1,x2,y2];}
function mk(layer,o){
  const it={layer,group:'',sub:'',...o};
  if(it.kind==='point'){const [x,y]=P(it.lon,it.lat);it.wx=x;it.wy=y;it.box=[x,y,x,y];}
  else{it.box=boxOfD(it.d);if(it.lon!==undefined){const [x,y]=P(it.lon,it.lat);it.wx=x;it.wy=y;}else{it.wx=(it.box[0]+it.box[2])/2;it.wy=(it.box[1]+it.box[3])/2;}}
  return it;
}
function lineMid(lines){ // en uzun çizginin orta noktası
  let best=lines[0];lines.forEach(l=>{if(l.length>best.length)best=l;});return best[Math.floor(best.length/2)];
}
const ITEMS={};
(function buildItems(){
  const I=(k)=>ITEMS[k]=[];
  I('kirik');HORSTS.forEach(h=>{const m=lineMid(h.lines);ITEMS.kirik.push(mk('kirik',{name:h.name,group:'Horstlar',sub:'Horst',color:C.kirik,kind:'line',d:h.lines.map(toD).join(''),lon:m[0],lat:m[1]}));});
  GRABENS.forEach(g=>ITEMS.kirik.push(mk('kirik',{name:g[0],group:'Grabenler',sub:'Graben',color:C.kirik,kind:'point',marker:'graben',lon:g[1],lat:g[2],tol:35})));
  I('kivrim');(BOOK.folds||[]).concat(FOLDS_EXTRA).forEach(f=>{const m=lineMid(f.lines);ITEMS.kivrim.push(mk('kivrim',{name:f.name,sub:f.extra?'kitap haritasında çizili değil':'',color:C.kivrim,kind:'line',d:f.lines.map(toD).join(''),lon:m[0],lat:m[1]}));});
  I('volkanik');VOLCANOES.forEach(v=>ITEMS.volkanik.push(mk('volkanik',{name:v[0],color:C.volkanik,kind:'point',marker:'volcano',lon:v[1],lat:v[2],tol:35})));
  I('fay');FAULTS.forEach(f=>{const m=f.pts[Math.floor(f.pts.length/2)];ITEMS.fay.push(mk('fay',{name:f.name,sub:f.cities.join(', '),color:C.fay,kind:'line',d:toD(f.pts),lon:m[0],lat:m[1],cities:f.cities,nolabel:true}));});
  I('ova');Object.keys(PLAIN_TYPES).forEach(t=>(BOOK.plains||[]).filter(p=>p.type===t).forEach(p=>ITEMS.ova.push(mk('ova',{name:p.name,group:PLAIN_TYPES[t][0],color:PLAIN_TYPES[t][1],kind:'area',d:p.path,lon:p.lon,lat:p.lat,sub:p.river?p.river+' deltası':(p.mountain?p.mountain+' eteği':'')}))));
  I('plato');Object.keys(PLATEAU_TYPES).forEach(t=>(BOOK.plateaus||[]).filter(p=>p.type===t).forEach(p=>ITEMS.plato.push(mk('plato',{name:p.name,group:PLATEAU_TYPES[t][0],color:PLATEAU_TYPES[t][1],kind:'area',d:p.path,lon:p.lon,lat:p.lat}))));
  I('masif');(BOOK.massifs||[]).forEach(p=>ITEMS.masif.push(mk('masif',{name:p.name,color:C.masif,kind:'area',d:p.path,lon:p.lon,lat:p.lat})));
  I('nehirler');I('akarsular');I('sinir');
  (OSM.rivers||[]).forEach(r=>{const meta=RIVER_META[r.name]||['kol',''];const base={name:r.name,kind:'line',d:r.path,lon:r.lon,lat:r.lat,basin:meta[1],border:meta[2]};
    if(meta[0]==='nehir')ITEMS.nehirler.push(mk('nehirler',{...base,color:C.nehirler,sub:meta[1]+' havzası'}));
    if(meta[0]==='kol')ITEMS.akarsular.push(mk('akarsular',{...base,color:C.akarsular,sub:meta[1]}));
    if(meta[2])ITEMS.sinir.push(mk('sinir',{...base,color:C.sinir,sub:meta[2]}));});
  I('goller');Object.keys(LAKE_TYPES).forEach(t=>(OSM.lakes||[]).filter(l=>LAKE_META[l.name]===t).forEach(l=>ITEMS.goller.push(mk('goller',{name:l.name,group:LAKE_TYPES[t],sub:l.real?'':'yaklaşık konum',color:C.goller,kind:'area',d:l.path,lon:l.lon,lat:l.lat,tol:12}))));
  I('barajlar');(OSM.dams||[]).map(d=>({...d,meta:DAM_META[d.name]||['',0]})).sort((a,b)=>(a.meta[1]||99)-(b.meta[1]||99)).forEach(d=>
    ITEMS.barajlar.push(mk('barajlar',{name:d.name,group:d.meta[1]?'En büyük 10 baraj':'Diğer barajlar',sub:(d.meta[1]?d.meta[1]+'. · ':'')+d.meta[0],color:C.barajlar,kind:'point',marker:'dam',lon:d.lon,lat:d.lat,tol:25})));
  I('havza');['açık','kapalı'].forEach(k=>(BOOK.basins||[]).filter(b=>b.kind===k).forEach(b=>ITEMS.havza.push(mk('havza',{name:b.name,group:k==='açık'?'Açık havzalar':'Kapalı havzalar',color:b.color,kind:'area',d:b.path,lon:b.lon,lat:b.lat}))));
  I('toprak');(BOOK.soils||[]).forEach(s=>ITEMS.toprak.push(mk('toprak',{name:s.name,key:s.key,color:s.color,kind:'area',d:s.path,lon:s.lon,lat:s.lat})));
  I('deprem');(BOOK.quake||[]).forEach(q=>ITEMS.deprem.push(mk('deprem',{name:q.name,sub:q.desc,color:q.color,kind:'area',d:q.path,lon:q.lon,lat:q.lat})));
  I('bolge');REGION_GEO.forEach(g=>ITEMS.bolge.push(mk('bolge',{name:g.full,sub:g.cities.length+' il',color:g.color,kind:'area',d:GEO.prov.filter(p=>p.region===g.key).map(p=>p.path).join(''),lon:g.lon,lat:g.lat})));
  I('iller');GEO.prov.forEach(p=>{const c=ILLER_XY[p.name];ITEMS.iller.push(mk('iller',{name:p.name,group:p.region,color:C.city,kind:'area',d:p.path,lon:c?c[0]:undefined,lat:c?c[1]:undefined,nolabel:true}));});
  I('komsu');(GEO.neighbors||[]).forEach(n=>ITEMS.komsu.push(mk('komsu',{name:n.name,sub:'kara sınırı',color:C.komsu,kind:'area',d:n.path,lon:n.labelLon,lat:n.labelLat})));
  I('levha');PLATES.forEach(p=>ITEMS.levha.push(mk('levha',{name:p[0],color:C.levha,kind:'point',marker:'none',lon:p[1],lat:p[2],tol:320})));
})();

/* ---------- world (haritanın kendisi) ---------- */
const AREA_STYLE={toprak:[.82,.5],deprem:[.78,.5],havza:[.72,.6],bolge:[.34,.6],komsu:[.2,.7],masif:[.6,.9],plato:[.62,.95],ova:[.62,.95],goller:[.9,1]};
function buildWorld(){
  let h=`<rect x="-4000" y="-4000" width="9000" height="9000" fill="var(--sea)"/>`;
  h+=`<path d="${GEO.neigh}" fill="var(--neigh)" stroke="var(--border)" stroke-width="0.8" vector-effect="non-scaling-stroke"/>`;
  h+=`<path d="${GEO.tur}" fill="var(--land)" stroke="var(--tur-border)" stroke-width="1.3" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>`;
  h+=`<defs><clipPath id="turClip"><path d="${GEO.tur}"/></clipPath>
    <pattern id="hatch" patternUnits="userSpaceOnUse" width="14" height="14" patternTransform="rotate(45)"><rect width="14" height="14" fill="#8FD4F5"/><line x1="0" y1="0" x2="0" y2="14" stroke="#2F6F95" stroke-width="2.2"/></pattern></defs>`;
  h+=`<g id="fills"></g><g id="lines"></g><g id="qhl"></g><path id="hit" d="" visibility="hidden" fill="#000" stroke="#000" fill-rule="evenodd"/>`;
  world.innerHTML=h;
}
function areaSvg(it,op,sop){
  const fill=it.key==='kirecli'?'url(#hatch)':it.color;
  return `<path d="${it.d}" fill="${fill}" fill-opacity="${op}" fill-rule="evenodd" stroke="${it.color}" stroke-opacity="${sop}" stroke-width="0.8" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
}
const lineSvg=(d,col,w,halo,dash)=>(halo?`<path d="${d}" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="${w+2.2}" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`:'')+
  `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${dash?`stroke-dasharray="${dash}"`:''} vector-effect="non-scaling-stroke"/>`;
function buildZones(){
  let f='';
  ['toprak','deprem','havza'].forEach(l=>{if(state.on[l])ITEMS[l].forEach(it=>f+=areaSvg(it,...AREA_STYLE[l]));});
  if(state.on.bolge) f+=GEO.prov.map(p=>`<path d="${p.path}" fill="${p.color}" fill-opacity=".34" stroke="${p.color}" stroke-opacity=".6" stroke-width="0.7" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`).join('');
  if(state.on.iller&&!state.on.bolge) f+=GEO.prov.map(p=>`<path d="${p.path}" fill="none" stroke="#7E907E" stroke-opacity=".55" stroke-width="0.6" vector-effect="non-scaling-stroke"/>`).join('');
  let g='';
  if(state.on.komsu) ITEMS.komsu.forEach(it=>g+=`<path d="${it.d}" fill="#6D8594" fill-opacity=".2" stroke="#58717F" stroke-opacity=".7" stroke-width="0.8" vector-effect="non-scaling-stroke"/>`);
  ['masif','plato','ova','goller'].forEach(l=>{if(state.on[l])ITEMS[l].forEach(it=>f+=areaSvg(it,...AREA_STYLE[l]));});
  document.getElementById('fills').innerHTML=f;
  if(state.on.akarsular) ITEMS.akarsular.forEach(it=>g+=lineSvg(it.d,C.akarsular,1.5));
  if(state.on.nehirler) ITEMS.nehirler.forEach(it=>g+=lineSvg(it.d,C.nehirler,2.2,true));
  if(state.on.sinir) ITEMS.sinir.forEach(it=>g+=lineSvg(it.d,C.sinir,3.2,true,'7 4'));
  if(state.on.fay) ITEMS.fay.forEach(it=>g+=lineSvg(it.d,C.fay,2.4,true));
  if(state.on.kivrim) ITEMS.kivrim.forEach(it=>g+=lineSvg(it.d,C.kivrim,4.2,true));
  if(state.on.kirik) ITEMS.kirik.filter(it=>it.kind==='line').forEach(it=>g+=lineSvg(it.d,C.kirik,4.2,true));
  document.getElementById('lines').innerHTML=g;
  // clip ile Türkiye dışına taşan kitap poligonlarını kes
  document.getElementById('fills').setAttribute('clip-path','url(#turClip)');
}

/* ---------- etiketler (ekran koordinatı) ---------- */
function overlap(a,b){return !(a.x2<b.x1||a.x1>b.x2||a.y2<b.y1||a.y1>b.y2);}
const MARKER={
  volcano:(x,y,c)=>`<path d="M${x},${y-6}L${x+6.5},${y+5}H${x-6.5}Z" fill="${c}" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/>`,
  graben:(x,y,c)=>`<path d="M${x-6.5},${y-5}H${x+6.5}L${x},${y+6}Z" fill="${c}" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/>`,
  dam:(x,y,c)=>`<rect x="${x-4.5}" y="${y-4.5}" width="9" height="9" rx="1.5" fill="${c}" stroke="#fff" stroke-width="1.4"/>`,
  none:()=>''
};
const LABEL_ORDER=['bolge','levha','volkanik','barajlar','kirik','kivrim','masif','plato','ova','goller','nehirler','sinir','akarsular','havza','toprak','deprem','komsu'];
function renderOverlay(){
  const placed=[]; let out=''; let hidden=0; labelHits=[];
  const labelsOn=!QUIZ.active;
  const inView=(x,y,m=60)=>x>-m&&x<W+m&&y>-m&&y<H+m;
  const free=(r)=>r.x1>4&&r.x2<W-4&&r.y1>4&&r.y2<H-4&&!placed.some(p=>overlap(r,p));
  const txt=(t,x,y,s,w,c,it,anchor)=>`<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor||'start'}" class="lb" font-size="${s}" font-weight="${w}" ${it?'font-style="italic"':''} fill="${c}">${esc(t)}</text>`;
  // aday konumlardan ilk boş olana etiket koy. cands: [dx,dy,leader?] (kutunun sol üst köşesi = x+dx, y+dy)
  function label(t,x,y,col,opt={}){
    const s=opt.size||12,w=opt.weight||700,bw=tw(t,s,w,opt.italic),bh=s+2;
    const c=opt.cands||[[9,-bh/2],[-9-bw,-bh/2],[-bw/2,-bh-8],[-bw/2,8],[24,-bh/2-14,1],[-24-bw,-bh/2+14,1],[-bw/2,-bh-26,1],[-bw/2,26,1]];
    for(const [dx,dy,lead] of c){const r={x1:x+dx-2,y1:y+dy-1,x2:x+dx+bw+2,y2:y+dy+bh+1};
      if(free(r)){placed.push(r);if(opt.ref)labelHits.push({r,ref:opt.ref});
        if(lead){const lx=Math.min(Math.max(x,x+dx),x+dx+bw),ly=Math.min(Math.max(y,y+dy),y+dy+bh);out+=`<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${lx.toFixed(1)}" y2="${ly.toFixed(1)}" stroke="${col}" stroke-opacity=".7" stroke-width="1"/>`;}
        out+=txt(t,x+dx,y+dy+s*.84,s,w,col,opt.italic);return true;}}
    hidden++;return false;
  }
  const centered=(bw,bh)=>[[-bw/2,-bh/2],[-bw/2,-bh/2-bh-4],[-bw/2,bh/2+4],[-bw/2,-bh/2-34,1],[-bw/2,bh/2+30,1],[16,-bh/2-24,1],[-bw-16,-bh/2-24,1]];
  // şehir ve nokta işaretleri önce yer ayırır
  const cityVisible=new Map();
  if(state.on.fay&&state.cities){
    ITEMS.fay.forEach(f=>f.cities.forEach(n=>{const c=CITY[n];if(!c||cityVisible.has(n))return;const [wx,wy]=P(c[0],c[1]);const x=sx(wx),y=sy(wy);if(inView(x,y))cityVisible.set(n,[x,y]);}));
    cityVisible.forEach(([x,y])=>placed.push({x1:x-3.5,y1:y-3.5,x2:x+3.5,y2:y+3.5}));
  }
  const pts=[];
  ['volkanik','barajlar','kirik'].forEach(l=>{if(state.on[l])ITEMS[l].filter(it=>it.kind==='point').forEach(it=>{const x=sx(it.wx),y=sy(it.wy);if(inView(x,y)){pts.push([it,x,y]);placed.push({x1:x-6,y1:y-6,x2:x+6,y2:y+6});}});});
  pts.forEach(([it,x,y])=>out+=MARKER[it.marker](x,y,it.color));
  cityVisible.forEach(([x,y])=>out+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.4" fill="${C.city}" stroke="${C.fay}" stroke-width="1.6"/>`);
  if(labelsOn){
    const provLabels=()=>{if(!(state.on.iller||state.on.bolge)||!state.provNames)return;
      ITEMS.iller.forEach((it,i)=>{if(it.wx===undefined)return;const x=sx(it.wx),y=sy(it.wy);if(!inView(x,y,60))return;const bw=tw(it.name,10.5,700);label(it.name,x,y,C.city,{size:10.5,cands:centered(bw,12.5),ref:['iller',i]});});};
    LABEL_ORDER.forEach(l=>{if(l==='volkanik')provLabels();if(!state.on[l])return;
      ITEMS[l].forEach((it,i)=>{if(it.nolabel)return;const x=sx(it.wx),y=sy(it.wy);if(!inView(x,y,100))return;const ref=[l,i];
        if(l==='bolge'){const s=W<480?10.5:12.5,t=it.name.toUpperCase(),bw=tw(t,s,800)+t.length*1.2;label(t,x,y,it.color,{size:s,weight:800,cands:centered(bw,s+2),ref});return;}
        if(l==='levha'){const t=it.name,bw=tw(t,15,700);label(t,x,y,C.levha,{size:15,cands:centered(bw,17),ref});return;}
        const s=l==='akarsular'||l==='sinir'?11:(it.kind==='area'&&(l==='toprak'||l==='deprem'||l==='havza')?11.5:12);
        const col=l==='toprak'||l==='deprem'||l==='havza'?'#243038':(l==='ova'||l==='plato'?shade(it.color):it.color);
        const italic=l==='nehirler'||l==='akarsular'||l==='sinir';
        if(it.kind==='area'){const bw=tw(it.name,s,700,italic);label(it.name,x,y,col,{size:s,italic,cands:centered(bw,s+2),ref});}
        else label(it.name,x,y,col,{size:s,italic,ref});
      });});
    cityVisible.forEach(([x,y],n)=>label(n,x,y,C.city,{size:10.5,cands:[[7,-6.5],[-7-tw(n,10.5,700),-6.5],[-tw(n,10.5,700)/2,-18],[-tw(n,10.5,700)/2,6]]}));
    SEAS.forEach(s=>{const [wx,wy]=P(s[1],s[2]);const x=sx(wx),y=sy(wy);if(!inView(x,y,100))return;const bw=tw(s[0],12,500,true);const r={x1:x-bw/2,y1:y-7,x2:x+bw/2,y2:y+7};
      if(free(r)){placed.push(r);out+=txt(s[0],x,y+4,12,500,C.sea,true,'middle');}});
  }
  // çıkmış soru: haritalı soru işaretleri (Romen rakamlı)
  if(QUIZ.mode==='exam'&&QUIZ.examQ&&QUIZ.examQ.map){
    const q=QUIZ.examQ,good=romansOf(q.options[q.answer]),picked=QUIZ.selOpt>=0?romansOf(q.options[QUIZ.selOpt]):new Set();
    // eşleştirme sorusu (şıkta Romen rakamı yok): doğru şıkkın parçaları işaretlerin yanına yazılır
    const parts=good.size?null:q.options[q.answer].split(/\s+[-–]\s+/);
    // parça sayısı işaret sayısına eşit değilse tüm işaretler aynı cevabı gösterir (örn. hepsi "Rüzgar")
    const matching=parts&&parts.length===q.map.length,names=QUIZ.answered&&parts?(matching?parts:q.map.map(()=>q.options[q.answer])):null;
    const pos=q.map.map(m=>{const [wx,wy]=P(m.lon,m.lat);return [sx(wx),sy(wy)];});
    pos.forEach(([x,y])=>placed.push({x1:x-13,y1:y-13,x2:x+13,y2:y+13}));
    q.map.forEach((m,i)=>{
      const [x,y]=pos[i];
      let fill='#E8B04A',stroke='#16262E';
      if(QUIZ.answered&&parts&&!matching)fill='#1E8F4E';
      else if(QUIZ.answered&&good.size){
        if(good.has(m.roman))fill='#1E8F4E';
        else if(picked.has(m.roman))fill='#C62828';
        else fill='#8FA0A8';
      }
      out+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="12" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
      out+=`<text x="${x.toFixed(1)}" y="${(y+4.5).toFixed(1)}" text-anchor="middle" font-size="13" font-weight="700" fill="#fff">${m.roman}</text>`;
    });
    if(names)q.map.forEach((m,i)=>label(`${m.roman}: ${names[i]}`,pos[i][0],pos[i][1],'#0E6B38',{size:13,cands:[[15,-8],[-15-tw(`${m.roman}: ${names[i]}`,13,700),-8],[-tw(`${m.roman}: ${names[i]}`,13,700)/2,-32],[-tw(`${m.roman}: ${names[i]}`,13,700)/2,16]]}));
  }
  // çıkmış soru: haritasız sorularda doğru şıkkın yeri
  if(QUIZ.mode==='exam'&&QUIZ.answered&&QUIZ.reveal){
    QUIZ.reveal.forEach(it=>{const x=sx(it.wx),y=sy(it.wy);
      if(it.kind==='point')out+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="10" fill="none" stroke="#1E8F4E" stroke-width="3.2"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="#1E8F4E"/>`;
      placed.push({x1:x-11,y1:y-11,x2:x+11,y2:y+11});});
    QUIZ.reveal.forEach(it=>{const x=sx(it.wx),y=sy(it.wy);
      if(it.kind==='point')label(it.name,x,y,'#0E6B38',{size:13});
      else{const bw=tw(it.name,13,700);label(it.name,x,y,'#0E6B38',{size:13,cands:centered(bw,15)});}});
  }
  // quiz işaretleri
  if(QUIZ.active&&QUIZ.answered&&QUIZ.guess){
    const t=QUIZ.target,gx=sx(QUIZ.guess[0]),gy=sy(QUIZ.guess[1]);
    if(t.kind==='point'){const tx=sx(t.wx),ty=sy(t.wy);
      out+=`<line x1="${gx.toFixed(1)}" y1="${gy.toFixed(1)}" x2="${tx.toFixed(1)}" y2="${ty.toFixed(1)}" stroke="#333" stroke-width="1.4" stroke-dasharray="4 3"/>`;
      out+=`<circle cx="${tx.toFixed(1)}" cy="${ty.toFixed(1)}" r="9" fill="none" stroke="#1E8F4E" stroke-width="3"/><circle cx="${tx.toFixed(1)}" cy="${ty.toFixed(1)}" r="2.6" fill="#1E8F4E"/>`;}
    else if(QUIZ.near){const nx=sx(QUIZ.near[0]),ny=sy(QUIZ.near[1]);if(!QUIZ.ok)out+=`<line x1="${gx.toFixed(1)}" y1="${gy.toFixed(1)}" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}" stroke="#333" stroke-width="1.4" stroke-dasharray="4 3"/>`;}
    out+=QUIZ.ok?`<circle cx="${gx.toFixed(1)}" cy="${gy.toFixed(1)}" r="6" fill="#1E8F4E" stroke="#fff" stroke-width="2"/>`:
      `<path d="M${gx-7},${gy-7}L${gx+7},${gy+7}M${gx-7},${gy+7}L${gx+7},${gy-7}" stroke="#C62828" stroke-width="3.2" stroke-linecap="round"/>`;
  }
  over.innerHTML=out;
  if(tour.on&&typeof tour.target==='function')positionTour();
  note.textContent=hidden>0?`${hidden} ad sığmadığı için gizlendi. Yakınlaştırınca görünür.`:'';
  note.hidden=hidden===0||QUIZ.active;
}
const tour={on:false,i:-1,saved:null,els:null}; // tanıtım turu durumu (aşağıda)
let labelHits=[]; // son çizimde yerleşen etiketlerin ekran kutuları: {r,ref:[katman,indeks]}
function shade(hex){const n=parseInt(hex.slice(1),16);const f=.62;return '#'+[n>>16,(n>>8)&255,n&255].map(v=>Math.round(v*f).toString(16).padStart(2,'0')).join('');}

/* ---------- görünüm ---------- */
function apply(){world.setAttribute('transform',`translate(${state.tx.toFixed(2)} ${state.ty.toFixed(2)}) scale(${S().toFixed(4)})`);}
let raf=0;function draw(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;apply();renderOverlay();});}
function resize(){const r=svg.getBoundingClientRect();W=Math.max(300,r.width);H=Math.max(300,r.height);svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
  fit=Math.min(W/REG.w,H/REG.h)*0.98;if(!resize.done||state.k===1){resetView();resize.done=true;}else{draw();}}
function home(){return [1,W/2-REG.cx*fit,H/2-REG.cy*fit];}
function resetView(){const h=home();state.k=1;state.tx=h[1];state.ty=h[2];draw();}
function zoomAt(f,cx,cy){const nk=Math.min(20,Math.max(1,state.k*f));const r=nk/state.k;state.tx=cx-(cx-state.tx)*r;state.ty=cy-(cy-state.ty)*r;state.k=nk;draw();}
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
function animateTo(k,tx,ty){if(reduce){state.k=k;state.tx=tx;state.ty=ty;draw();return;}
  const k0=state.k,x0=state.tx,y0=state.ty,t0=performance.now();(function step(t){const u=Math.min(1,(t-t0)/380),e=1-Math.pow(1-u,3);
    state.k=k0+(k-k0)*e;state.tx=x0+(tx-x0)*e;state.ty=y0+(ty-y0)*e;apply();renderOverlay();if(u<1)requestAnimationFrame(step);})(t0);}
function focusBox(b,minK){
  const w=Math.max(b[2]-b[0],90),h=Math.max(b[3]-b[1],70);
  let k=Math.min(W/(w*fit*1.6),H/(h*fit*1.6));k=Math.min(minK||6,Math.max(1,k));
  const s=fit*k;animateTo(k,W/2-(b[0]+b[2])/2*s,H/2-(b[1]+b[3])/2*s);
  if(matchMedia('(max-width:900px)').matches)document.getElementById('stage').scrollIntoView({block:'start',behavior:reduce?'auto':'smooth'});
}

/* ---------- etkileşim ---------- */
const ptrs=new Map();let lastD=0,moveDist=0;
svg.addEventListener('pointerdown',e=>{try{svg.setPointerCapture(e.pointerId);}catch(_){}ptrs.set(e.pointerId,[e.clientX,e.clientY]);lastD=0;svg.classList.add('drag');if(ptrs.size===1)moveDist=0;});
let hoverRaf=0;
svg.addEventListener('pointermove',e=>{if(ptrs.size||QUIZ.active||e.pointerType!=='mouse'||hoverRaf)return;
  hoverRaf=requestAnimationFrame(()=>{hoverRaf=0;const r=svg.getBoundingClientRect();svg.style.cursor=hitTest(e.clientX-r.left,e.clientY-r.top)?'pointer':'';});});
svg.addEventListener('pointerleave',()=>{svg.style.cursor='';});
svg.addEventListener('pointermove',e=>{if(!ptrs.has(e.pointerId))return;const p=ptrs.get(e.pointerId);
  if(ptrs.size===1){const dx=e.clientX-p[0],dy=e.clientY-p[1];state.tx+=dx;state.ty+=dy;ptrs.set(e.pointerId,[e.clientX,e.clientY]);moveDist+=Math.hypot(dx,dy);draw();}
  else if(ptrs.size===2){ptrs.set(e.pointerId,[e.clientX,e.clientY]);const [a,b]=[...ptrs.values()];const d=Math.hypot(a[0]-b[0],a[1]-b[1]);const r=svg.getBoundingClientRect();
    if(lastD)zoomAt(d/lastD,(a[0]+b[0])/2-r.left,(a[1]+b[1])/2-r.top);lastD=d;moveDist+=10;}});
const up=e=>{const wasSingle=ptrs.size===1;ptrs.delete(e.pointerId);lastD=0;if(!ptrs.size)svg.classList.remove('drag');
  if(wasSingle&&QUIZ.active&&QUIZ.mode==='explore'&&!QUIZ.answered&&QUIZ.target&&moveDist<6){const r=svg.getBoundingClientRect();submitGuess(e.clientX-r.left,e.clientY-r.top);}
  else if(wasSingle&&!QUIZ.active&&moveDist<6&&e.type==='pointerup'){const r=svg.getBoundingClientRect();mapClick(e.clientX-r.left,e.clientY-r.top);}
  moveDist=0;};
svg.addEventListener('pointerup',up);svg.addEventListener('pointercancel',up);
svg.addEventListener('wheel',e=>{e.preventDefault();const r=svg.getBoundingClientRect();zoomAt(Math.exp(-e.deltaY*0.0016),e.clientX-r.left,e.clientY-r.top);},{passive:false});
svg.addEventListener('dblclick',e=>{if(QUIZ.active)return;const r=svg.getBoundingClientRect();zoomAt(1.8,e.clientX-r.left,e.clientY-r.top);});
document.getElementById('zin').onclick=()=>zoomAt(1.5,W/2,H/2);
document.getElementById('zout').onclick=()=>zoomAt(1/1.5,W/2,H/2);
document.getElementById('zreset').onclick=()=>animateTo(...home());
svg.addEventListener('keydown',e=>{const st=60;if(e.key==='+'||e.key==='=')zoomAt(1.4,W/2,H/2);else if(e.key==='-')zoomAt(1/1.4,W/2,H/2);
  else if(e.key==='ArrowLeft')state.tx+=st;else if(e.key==='ArrowRight')state.tx-=st;else if(e.key==='ArrowUp')state.ty+=st;else if(e.key==='ArrowDown')state.ty-=st;else return;e.preventDefault();draw();});

/* ---------- panel: katmanlar ---------- */
const sw=(inner)=>`<svg width="16" height="14" viewBox="0 0 16 14">${inner}</svg>`;
const tri=c=>`<path d="M8 1L15 13H1Z" fill="${c}"/>`;
const wave=(c,w,dash)=>`<path d="M1 11C5 2 10 13 15 3" fill="none" stroke="${c}" stroke-width="${w}" ${dash?'stroke-dasharray="3 2"':''}/>`;
const blob=(a,b)=>`<ellipse cx="6" cy="7" rx="5" ry="4" fill="${a}" fill-opacity=".8"/><ellipse cx="11" cy="8" rx="4" ry="3.5" fill="${b}" fill-opacity=".85"/>`;
const swatch={kirik:sw(`<path d="M2 11L14 4" stroke="${C.kirik}" stroke-width="3.2" stroke-linecap="round"/>`),kivrim:sw(`<path d="M1 10Q8 2 15 8" fill="none" stroke="${C.kivrim}" stroke-width="3.2" stroke-linecap="round"/>`),volkanik:sw(tri(C.volkanik)),
 fay:sw(`<path d="M1 12L6 6L10 9L15 2" fill="none" stroke="${C.fay}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`),
 ova:sw(blob('#B06FB3','#4FA06A')),plato:sw(blob('#A56BC4','#E8706C')),masif:sw(`<ellipse cx="8" cy="7" rx="7" ry="5" fill="${C.masif}" fill-opacity=".8"/>`),
 nehirler:sw(wave(C.nehirler,2.5)),akarsular:sw(wave(C.akarsular,1.6)),sinir:sw(wave(C.sinir,2.6,true)),
 goller:sw(`<ellipse cx="8" cy="8" rx="6.5" ry="4.5" fill="#4FA8D8" stroke="${C.goller}"/>`),barajlar:sw(`<rect x="4" y="3" width="8" height="8" rx="1.5" fill="${C.barajlar}"/>`),
 havza:sw(blob('#BDE7E1','#F1C8B6')),toprak:sw(blob('#EF8A8F','#EEEE9A')),deprem:sw(blob('#EF8A63','#C09CCC')),
 bolge:sw(`<path d="M2 9 Q1 3 8 3 Q15 3 14 9 Q13 12 8 12 Q3 12 2 9Z" fill="#3D6EA5" fill-opacity=".45" stroke="#3D6EA5" stroke-dasharray="2 1.3"/>`),
 iller:sw(`<circle cx="5" cy="5" r="2.4" fill="#22303B"/><circle cx="11" cy="8" r="2.4" fill="#22303B"/><circle cx="5" cy="11" r="2" fill="#22303B"/>`),
 komsu:sw(`<path d="M1 3h14v8H1Z" fill="#6D8594" fill-opacity=".35" stroke="#58717F"/>`),
 levha:sw(`<text x="8" y="11" text-anchor="middle" font-size="12" font-weight="700" fill="#9FC2DD" font-family="serif">L</text>`)};
const LAYERS=[
 ['Yer şekilleri',[['kirik','Kırık dağlar','horst · graben'],['kivrim','Kıvrım dağları','kitap s.55'],['volkanik','Volkanik dağlar','kitap s.57'],['fay','Fay hatları','şehirlerle'],['ova','Ovalar','6 oluşum türü'],['plato','Platolar','5 tür'],['masif','Masifler','kitap s.21']]],
 ['Su',[['nehirler','Nehirler','gerçek güzergâh'],['akarsular','Kollar','nehir kolları'],['sinir','Sınır akarsuları','8 akarsu'],['goller','Göller','oluşum türleriyle'],['barajlar','Barajlar','en büyük 10 ve diğerleri'],['havza','Akarsu havzaları','açık · kapalı']]],
 ['Toprak ve deprem',[['toprak','Topraklar','kitap s.112-114'],['deprem','Deprem bölgeleri','kitap s.33']]],
 ['Genel',[['bolge','Bölgeler','il sınırlarıyla'],['iller','Tüm iller','81 il'],['komsu','Komşularımız','8 ülke'],['levha','Levhalar','yalnızca isim']]]
];
const LAYER_NAME=Object.fromEntries(LAYERS.flatMap(g=>g[1]).map(l=>[l[0],l[1]]));
function buildToggles(){
  const html=LAYERS.map(([g,ls],gi)=>{const n=ls.filter(([id])=>state.on[id]).length;
    return `<div class="tgh"><span>${g} <em>${n}/${ls.length}</em></span><button type="button" class="tgall" data-g="${gi}">${n===ls.length?'Kapat':'Hepsini aç'}</button></div>`+ls.map(([id,t,s])=>`<label class="tg"><input type="checkbox" data-l="${id}" ${state.on[id]?'checked':''}><span class="sw">${swatch[id]}</span><span class="tt"><b>${t}</b><small>${s}</small></span></label>`+
    (id==='iller'&&(state.on.iller||state.on.bolge)?`<label class="tgsub"><input type="checkbox" data-pn ${state.provNames?'checked':''}> İl adlarını göster</label>`:'')).join('');}).join('');
  [document.getElementById('toggles'),document.getElementById('togglesMap')].forEach(el=>{
    el.innerHTML=html;
    el.querySelectorAll('input[data-l]').forEach(i=>i.onchange=()=>{state.on[i.dataset.l]=i.checked;buildToggles();refresh();});
    el.querySelectorAll('.tgall').forEach(b=>b.onclick=e=>{e.stopPropagation();const ls=LAYERS[b.dataset.g][1],on=!ls.every(([id])=>state.on[id]);
      ls.forEach(([id])=>state.on[id]=on);buildToggles();refresh();});
    el.querySelectorAll('input[data-pn]').forEach(i=>i.onchange=()=>{state.provNames=i.checked;buildToggles();draw();});
  });
}
function refresh(){if(!QUIZ.active)highlight(null);buildZones();buildList();buildLegend();draw();document.getElementById('citiesRow').hidden=!state.on.fay;}
function bl(ul){return `<ul>${ul.map(t=>`<li>${t}</li>`).join('')}</ul>`;}
function gen(key){const g=GENERAL[key];return g?`<details class="gen"><summary>KPSS genel bilgiler</summary>${bl(g)}</details>`:'';}
const GRABEN_TOWNS={"Bakırçay Ovası":"Bergama, Soma, Kırkağaç","Gediz Ovası":"Manisa, Akhisar, Turgutlu, Salihli","Küçük Menderes Ovası":"Torbalı, Tire, Ödemiş","Büyük Menderes Ovası":"Söke, Aydın, Nazilli"};
function noteFor(it){ // kitaptaki sınıflandırmadan türetilen yedek not
  if(NOTES[it.name])return NOTES[it.name];
  if(it.layer==='ova'&&it.group===PLAIN_TYPES.tektonik[0]){const n=["Kitapta tektonik ovalar arasında gösterilir (s.67): faylanma ve kırılmalarla oluşan çöküntü alanlarının akarsu ve göllerin alüvyonlarıyla dolmasıyla oluşmuştur.","Tektonik ovalar verimli tarım alanlarıdır ama deprem riski yüksektir."];
    if(GRABEN_TOWNS[it.name])n.unshift(`Ege graben ovalarındandır; başlıca yerleşmeler: ${GRABEN_TOWNS[it.name]}.`);return n;}
  if(it.layer==='barajlar'){const m=DAM_META[it.name]||[];return [`${m[0]} üzerindedir; kitaptaki baraj haritasında (s.102) gösterilir.`,"Baraj gölleri enerji (HES), sulama, içme suyu ve taşkın kontrolü amacıyla kullanılır."];}
  return null;
}
function row(it,i){const n=noteFor(it);const mark=it.kind==='line'?'<i class="ln"></i>':it.kind==='area'?'<i class="ar"></i>':'<i class="dot"></i>';
  return `<li><button data-f="${it.layer}:${i}" style="--c:${it.color}" aria-expanded="false">${mark}<span>${esc(it.name)}${it.sub?`<small>${esc(it.sub)}</small>`:''}</span>${n?'<em class="chev" aria-hidden="true"></em>':''}</button>${n?`<div class="kp" style="--c:${it.color}" hidden><b>KPSS notları</b>${bl(n)}</div>`:''}</li>`;}
function buildList(){
  const box=document.getElementById('items');let h='';
  LAYERS.flatMap(g=>g[1]).forEach(([l,title])=>{if(!state.on[l]||l==='iller')return;
    const list=ITEMS[l];let rows='',grp=null;
    list.forEach((it,i)=>{if(it.group!==grp){if(it.group)rows+=`<li class="grp">${esc(it.group)}</li>`;grp=it.group;}rows+=row(it,i);});
    h+=`<section><h3>${title}</h3>${gen(l)}<ul class="lst">${rows}</ul></section>`;});
  if(state.on.iller){h+=`<section><h3>İller (81)</h3>${gen('iller')}`;
    Object.keys(BOLGE_ILLER).forEach(r=>{h+=`<p class="reg">${r} Bölgesi <span>${BOLGE_ILLER[r].length} il</span></p><div class="chips">${BOLGE_ILLER[r].map(n=>`<button class="chip" data-c="${n}">${n}</button>`).join('')}</div>`;});h+='</section>';}
  box.innerHTML=(h?`<p class="disc">Notlar ve alan sınırları <b>Coğrafyanın Kodları KPSS</b> (KPSS Coğrafya ders kitabı) esas alınarak hazırlanmıştır. Ova, plato, masif, toprak, havza ve deprem alanları kitap haritalarından sayısallaştırılmıştır (yaklaşık). Akarsu, göl ve baraj konumları OpenStreetMap verisidir.</p>`:'')+(h||'<p class="empty">Haritada göstermek için soldan bir katman seçin.</p>');
  box.querySelectorAll('.lst button').forEach(b=>b.onclick=()=>{const [l,i]=b.dataset.f.split(':');highlight(null);openInfo(l,+i,{toggle:true,focus:true});});
  box.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{const it=ITEMS.iller.find(x=>x.name===b.dataset.c);if(it)focusBox(it.box,6);});
}
// paneldeki öğenin KPSS notlarını aç. toggle: açıksa kapat (liste tıklaması); focus: haritada o öğeye git
function openInfo(l,i,opt={}){
  const box=document.getElementById('items'),it=ITEMS[l][i];
  box.querySelectorAll('.sel').forEach(e=>e.classList.remove('sel'));
  let b;
  if(l==='iller')b=[...box.querySelectorAll('.chip')].find(x=>x.dataset.c===it.name);
  else{b=box.querySelector(`.lst button[data-f="${l}:${i}"]`);
    const kp=b&&b.nextElementSibling,open=kp&&!kp.hidden;
    box.querySelectorAll('.kp').forEach(e=>e.hidden=true);box.querySelectorAll('.lst button').forEach(e=>e.setAttribute('aria-expanded','false'));
    if(kp&&!(opt.toggle&&open)){kp.hidden=false;b.setAttribute('aria-expanded','true');}}
  if(opt.focus)focusBox(it.box,it.kind==='point'?4:(l==='bolge'?2:8));
  else if(b){b.classList.add('sel');scrollPanelTo(b,true);}
}
// masaüstünde yalnızca sol paneli kaydır (scrollIntoView tüm sayfayı da kaydırıp düzeni bozuyor)
function scrollPanelTo(el,smooth){
  const behavior=smooth&&!reduce?'smooth':'auto';
  if(matchMedia('(max-width:900px)').matches){el.scrollIntoView({block:'center',behavior});return;}
  const pr=panelEl.getBoundingClientRect(),er=el.getBoundingClientRect();
  panelEl.scrollTo({top:panelEl.scrollTop+er.top-pr.top-(pr.height-er.height)/2,behavior});
}
// haritada tıklanan noktadaki öğe: önce etiket isimleri, sonra noktalar, sonra çizgiler, sonra en küçük alan
function hitTest(cx,cy){
  const lb=labelHits.find(({r})=>cx>=r.x1-4&&cx<=r.x2+4&&cy>=r.y1-4&&cy<=r.y2+4);
  if(lb)return lb.ref;
  const [wx,wy]=screenToWorld(cx,cy),kmPx=kmPerWorld(invP(wx,wy)[1]).y/S();
  const layers=[...LABEL_ORDER,'fay','iller'].filter(l=>state.on[l]&&ITEMS[l]);
  let best=null,bd=1e9;
  layers.forEach(l=>ITEMS[l].forEach((it,i)=>{if(it.kind!=='point')return;const d=Math.hypot(sx(it.wx)-cx,sy(it.wy)-cy);if(d<=10&&d<bd){bd=d;best=[l,i];}}));
  if(best)return best;
  layers.forEach(l=>ITEMS[l].forEach((it,i)=>{if(it.kind!=='line')return;const b=it.box,m=10/S();
    if(wx<b[0]-m||wx>b[2]+m||wy<b[1]-m||wy>b[3]+m)return;const d=nearestOn(it,wx,wy)[0]/kmPx;if(d<=8&&d<bd){bd=d;best=[l,i];}}));
  if(best)return best;
  const hit=document.getElementById('hit');
  layers.forEach(l=>ITEMS[l].forEach((it,i)=>{if(it.kind!=='area')return;const b=it.box;if(wx<b[0]||wx>b[2]||wy<b[1]||wy>b[3])return;
    hit.setAttribute('d',it.d);let inside;try{inside=hit.isPointInFill(new DOMPoint(wx,wy));}catch(e){const p=svg.createSVGPoint();p.x=wx;p.y=wy;inside=hit.isPointInFill(p);}
    const a=(b[2]-b[0])*(b[3]-b[1]);if(inside&&a<bd){bd=a;best=[l,i];}}));
  return best;
}
function mapClick(cx,cy){const h=hitTest(cx,cy);
  if(!h){highlight(null);document.querySelectorAll('#items .sel').forEach(e=>e.classList.remove('sel'));return;}
  highlight(ITEMS[h[0]][h[1]]);openInfo(h[0],h[1]);}
function buildLegend(){
  const el=document.getElementById('legend');const ls=['toprak','deprem','havza'].filter(l=>state.on[l]);
  if(!ls.length||QUIZ.active){el.hidden=true;return;}
  el.hidden=false;
  el.innerHTML=ls.map(l=>`<b>${LAYER_NAME[l]}</b>`+ITEMS[l].map(it=>`<span><i style="background:${it.key==='kirecli'?'repeating-linear-gradient(45deg,#8FD4F5 0 3px,#2F6F95 3px 4.5px)':it.color}"></i>${esc(it.name)}</span>`).join('')).join('');
}
document.getElementById('showCities').onchange=e=>{state.cities=e.target.checked;draw();};
function selectAllLayers(){Object.keys(state.on).forEach(k=>state.on[k]=!['toprak','deprem','havza','bolge','iller'].includes(k));buildToggles();refresh();}
function clearAllLayers(){Object.keys(state.on).forEach(k=>state.on[k]=false);buildToggles();refresh();}
document.getElementById('all').onclick=selectAllLayers;
document.getElementById('none').onclick=clearAllLayers;
document.getElementById('allMap').onclick=selectAllLayers;
document.getElementById('noneMap').onclick=clearAllLayers;

/* ---------- katman açılır menüsü (sağ üst) ---------- */
const layerBtn=document.getElementById('layerBtn'),layerMenu=document.getElementById('layerMenu');
const quizBtn=document.getElementById('quizBtn'),quizMenu=document.getElementById('quizMenu');
const MENUS=[[layerBtn,layerMenu],[quizBtn,quizMenu]];
function setMenu(btn,menu,open){menu.hidden=!open;btn.classList.toggle('on',open);btn.setAttribute('aria-expanded',open?'true':'false');}
function closeMenus(){MENUS.forEach(([b,m])=>setMenu(b,m,false));}
MENUS.forEach(([b,m])=>{b.onclick=e=>{e.stopPropagation();const open=m.hidden;closeMenus();if(open){if(m===quizMenu)syncQuizMenu();setMenu(b,m,true);}};m.onclick=e=>e.stopPropagation();});
document.addEventListener('click',closeMenus);
function syncQuizMenu(){document.getElementById('quizMenuBusy').hidden=!QUIZ.active;document.getElementById('quizMenuBody').hidden=QUIZ.active;}
quizMenu.querySelectorAll('[data-qn]').forEach(b=>b.onclick=()=>{closeMenus();if(!QUIZ.active)startQuiz(+b.dataset.qn);});
document.getElementById('quizMenuExam').onclick=()=>{closeMenus();if(!QUIZ.active)startExamQuiz();};

/* ---------- quiz ---------- */
// Doğrulama: tıklanan nokta hedefin alanı içinde ya da çizgisine/sınırına tolerans kadar yakınsa doğru.
const QUIZ={active:false,mode:'explore',pool:[],idx:0,total:8,correct:0,answered:false,guess:null,target:null,ok:false,near:null,dist:0,asked:8,examOrder:[],examQ:null,selOpt:-1};
let savedLayers=null;
const TOL_PX=14, MIN_TOL_KM=8, MAX_TOL_KM=30;
const DEFAULT_CATS=['kivrim','volkanik','kirik','ova','plato','masif','nehirler','goller','bolge'];
function kmPerWorld(lat){return {x:111.32*Math.cos(lat*Math.PI/180)/KX,y:110.57/KY};}
function segs(it){ // path -> [[x,y],...] çoklu çizgiler (önbellekli)
  if(it._segs)return it._segs;
  const out=[];(it.d.match(/M[^M]+/g)||[]).forEach(part=>{const n=part.match(/-?\d+(\.\d+)?/g).map(Number);const pts=[];for(let i=0;i+1<n.length;i+=2)pts.push([n[i],n[i+1]]);
    if(/Z/.test(part)&&pts.length)pts.push(pts[0]);out.push(pts);});
  return it._segs=out;
}
function nearestOn(it,wx,wy){ // en yakın nokta ve km mesafesi
  const k=kmPerWorld(invP(wx,wy)[1]);let best=1e9,bp=null;
  segs(it).forEach(pts=>{for(let i=0;i+1<pts.length;i++){const [ax,ay]=pts[i],[bx,by]=pts[i+1];
    const dx=(bx-ax)*k.x,dy=(by-ay)*k.y,px=(wx-ax)*k.x,py=(wy-ay)*k.y;const L=dx*dx+dy*dy;let t=L?(px*dx+py*dy)/L:0;t=Math.max(0,Math.min(1,t));
    const ex=px-t*dx,ey=py-t*dy,d=Math.hypot(ex,ey);if(d<best){best=d;bp=[ax+t*(bx-ax),ay+t*(by-ay)];}}});
  return [best,bp];
}
function judge(it,wx,wy){
  const k=kmPerWorld(invP(wx,wy)[1]);
  const tolKm=Math.min(MAX_TOL_KM,Math.max(TOL_PX/S()*k.y,MIN_TOL_KM));
  if(it.kind==='point'){const [lon,lat]=invP(wx,wy),[tl,tt]=invP(it.wx,it.wy);const d=distKm(lon,lat,tl,tt);return {ok:d<=Math.max(it.tol||35,tolKm),dist:d,near:[it.wx,it.wy],inside:false};}
  let inside=false;
  if(it.kind==='area'){const hit=document.getElementById('hit');hit.setAttribute('d',it.d);
    try{inside=hit.isPointInFill(new DOMPoint(wx,wy));}catch(e){const p=svg.createSVGPoint();p.x=wx;p.y=wy;inside=hit.isPointInFill(p);}}
  const [d,near]=nearestOn(it,wx,wy);
  return {ok:inside||d<=tolKm+(it.tol||0),dist:inside?0:d,near,inside};
}
function highlight(it){ // tek öğe ya da öğe dizisi
  const g=document.getElementById('qhl');
  g.innerHTML=[].concat(it||[]).filter(x=>x.kind!=='point').map(x=>x.kind==='area'?`<path d="${x.d}" fill="#1E8F4E" fill-opacity=".28" fill-rule="evenodd" stroke="#0E6B38" stroke-width="2.6" vector-effect="non-scaling-stroke"/>`
    :lineSvg(x.d,'#12A150',5,true)).join('');
}
function buildQuizPool(){
  let cats=Object.keys(state.on).filter(k=>state.on[k]);
  if(!cats.length)cats=DEFAULT_CATS;
  const seen=new Set();let pool=[];
  cats.forEach(c=>(ITEMS[c]||[]).forEach(it=>{if(seen.has(it.name))return;seen.add(it.name);pool.push(it);}));
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  return pool;
}
const qEl=document.getElementById('quizcard');
/* ---------- soru kartını sürükleyerek taşıma ---------- */
(function(){
  let dragging=false,sx0=0,sy0=0,ox=0,oy=0;
  qEl.addEventListener('pointerdown',e=>{
    if(!e.target.closest('.qtop')||e.target.closest('button')||qEl.closest('.panel'))return;
    const r=qEl.getBoundingClientRect();
    dragging=true;sx0=e.clientX;sy0=e.clientY;ox=r.left;oy=r.top;
    qEl.style.left=ox+'px';qEl.style.top=oy+'px';qEl.style.right='auto';qEl.style.transform='none';
    qEl.setPointerCapture(e.pointerId);
  });
  qEl.addEventListener('pointermove',e=>{
    if(!dragging)return;
    const pw=qEl.parentElement.clientWidth,ph=qEl.parentElement.clientHeight;
    const nx=Math.min(Math.max(ox+e.clientX-sx0,-qEl.offsetWidth+40),pw-40);
    const ny=Math.min(Math.max(oy+e.clientY-sy0,0),ph-40);
    qEl.style.left=nx+'px';qEl.style.top=ny+'px';
  });
  const stopDrag=()=>{dragging=false;};
  qEl.addEventListener('pointerup',stopDrag);
  qEl.addEventListener('pointercancel',stopDrag);
})();
function resetCardPos(){qEl.style.left='';qEl.style.top='';qEl.style.right='';qEl.style.transform='';}
function startQuiz(n){
  const pool=buildQuizPool();
  Object.assign(QUIZ,{active:true,mode:'explore',asked:n,pool:pool.slice(0,Math.min(n,pool.length)),idx:0,correct:0,answered:false,guess:null,target:null});
  QUIZ.total=QUIZ.pool.length;QUIZ.short=pool.length<n;
  document.querySelector('.modeSel').hidden=true;document.getElementById('modeExplore').hidden=true;document.getElementById('modeExam').hidden=true;
  document.getElementById('items').hidden=true;qEl.hidden=false;buildLegend();
  nextQ(false);
}
function nextQ(advance){
  if(advance)QUIZ.idx++;
  QUIZ.answered=false;QUIZ.guess=null;QUIZ.near=null;highlight(null);
  if(QUIZ.idx>=QUIZ.total){renderQuizDone();return;}
  QUIZ.target=QUIZ.pool[QUIZ.idx];
  renderQuizCard();draw();
}
function submitGuess(cx,cy){
  if(!QUIZ.active||QUIZ.answered)return;
  const [wx,wy]=screenToWorld(cx,cy);
  const r=judge(QUIZ.target,wx,wy);
  Object.assign(QUIZ,{guess:[wx,wy],answered:true,ok:r.ok,near:r.near,dist:r.dist,inside:r.inside});
  if(r.ok)QUIZ.correct++;
  highlight(QUIZ.target);renderQuizCard();draw();
}
function renderQuizCard(){
  const t=QUIZ.target;const what=t.kind==='area'?'alanına':t.kind==='line'?'çizgisine':'yerine';
  let html=`<div class="qtop"><span>Soru ${QUIZ.idx+1}/${QUIZ.total}</span><span>Puan: ${QUIZ.correct}</span><button id="qClose" aria-label="Kapat">✕</button></div>`;
  html+=`<div class="qq">“<b>${esc(t.name)}</b>” nerede?</div><div class="qcat">${esc(LAYER_NAME[t.layer]||'')}${t.group?' · '+esc(t.group):''}</div>`;
  if(QUIZ.answered){
    const km=Math.round(QUIZ.dist);
    const msg=QUIZ.ok?(QUIZ.inside?'✔ Doğru! Tam alanın içinde.':(t.kind==='point'?`✔ Doğru! Hedefe ${km} km.`:`✔ Doğru! ${t.kind==='line'?'Çizgiye':'Sınıra'} ${km} km yakınlıkta.`))
      :`✘ Olmadı — doğru ${t.kind==='point'?'yere':(t.kind==='line'?'çizgiye':'alana')} en kısa mesafe <b>${km} km</b>. Yeşil ile gösterildi.`;
    html+=`<div class="qres ${QUIZ.ok?'ok':'no'}">${msg}</div>`;
    html+=`<div class="qbar"><button id="qNext">${QUIZ.idx+1>=QUIZ.total?'Sonuçları gör':'Sonraki soru →'}</button></div>`;
  } else {
    html+=`<div class="qhint">Haritada ${what} dokun. Kenarına yakın dokunuşlar da doğru sayılır.${QUIZ.idx===0&&QUIZ.short?` <b>Aktif katmanlarda ${QUIZ.total} öğe var</b>, ${QUIZ.asked} yerine ${QUIZ.total} soru sorulacak.`:''}</div>`;
  }
  qEl.innerHTML=html;
  document.getElementById('qClose').onclick=endQuiz;
  if(QUIZ.answered)document.getElementById('qNext').onclick=()=>nextQ(true);
}
function renderQuizDone(){
  const pct=QUIZ.total?Math.round(100*QUIZ.correct/QUIZ.total):0;
  const res=QUIZ.mode==='exam'?`<div class="qscore">${fmtNet()} net</div><div>${QUIZ.correct} doğru · ${QUIZ.wrong} yanlış · ${QUIZ.total} soru</div><div class="qsrc">Net = doğru − yanlış ÷ 4</div>`
    :`<div class="qscore">${QUIZ.correct}/${QUIZ.total}</div><div>doğru (%${pct})</div>`;
  qEl.innerHTML=`<div class="qtop"><span>Sonuç</span><button id="qClose" aria-label="Kapat">✕</button></div>
    <div class="qdone">${res}</div>
    <div class="qbar"><button id="qAgain">Tekrar oyna</button><button id="qStop" class="ghost">Bitir</button></div>`;
  document.getElementById('qClose').onclick=endQuiz;
  document.getElementById('qAgain').onclick=()=>QUIZ.mode==='exam'?startExamQuiz():startQuiz(QUIZ.asked);
  document.getElementById('qStop').onclick=endQuiz;
  QUIZ.answered=false;QUIZ.guess=null;QUIZ.target=null;QUIZ.examQ=null;QUIZ.reveal=null;highlight(null);
  if(QUIZ.mode==='exam')resetView();else draw();
}
function endQuiz(){QUIZ.active=false;QUIZ.answered=false;QUIZ.guess=null;QUIZ.target=null;QUIZ.examQ=null;QUIZ.reveal=null;highlight(null);qEl.hidden=true;resetCardPos();
  if(appEl.classList.contains('docked')){appEl.classList.remove('docked');stageEl.insertBefore(qEl,stageEl.querySelector('.zoom'));}
  if(savedLayers){state.on=savedLayers;savedLayers=null;buildToggles();}
  document.querySelector('.modeSel').hidden=false;
  document.getElementById(QUIZ.mode==='exam'?'modeExam':'modeExplore').hidden=false;
  document.getElementById('items').hidden=false;refresh();}
document.querySelectorAll('.qn').forEach(b=>b.onclick=()=>startQuiz(+b.dataset.n));
const qCount=document.getElementById('quizCount'),qCountVal=document.getElementById('quizCountVal');
document.getElementById('moreQuiz').onclick=()=>{const c=document.getElementById('quizCustom');c.hidden=!c.hidden;if(!c.hidden)qCount.focus();};
qCount.oninput=()=>{qCountVal.textContent=qCount.value+' soru';};
document.getElementById('quizStartCustom').onclick=()=>startQuiz(+qCount.value);

/* ---------- çıkmış sorular (gerçek KPSS soruları, şıklı) ---------- */
document.getElementById('examStartBtn').textContent=`Başlat (${EXAM_Q.length} soru)`;
document.querySelectorAll('.modeBtn').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('.modeBtn').forEach(x=>{x.classList.toggle('on',x===b);x.setAttribute('aria-selected',x===b?'true':'false');});
  const exam=b.dataset.mode==='exam';
  document.getElementById('modeExplore').hidden=exam;
  document.getElementById('modeExam').hidden=!exam;
});
const appEl=document.querySelector('.app'),panelEl=document.querySelector('.panel'),stageEl=document.getElementById('stage');
const fmtNet=()=>(QUIZ.correct-QUIZ.wrong/4).toLocaleString('tr-TR',{maximumFractionDigits:2});
// şıktaki Romen rakamları ("IV ve V", "I, III ve V", "IV - Nemrut Dağı")
function romansOf(s){return new Set(String(s).match(/\b(?:IV|V|I{1,3})\b/g)||[]);}
// şık metnini haritadaki öğeye eşle: önce iller, sonra diğer katmanlar; "Ovası/Gölü/Platosu/çevresi" gibi ekler yok sayılır
const nrmName=s=>String(s).toLocaleLowerCase('tr').replace(/\s*[-–]\s*/g,'-').replace(/\s+(ovası|polyesi|gölü|dağları|dağı|platosu|çevresi|havzası|nehri|ırmağı|barajı|deltası)$/,'').trim();
function findItem(name){
  const layers=['iller',...Object.keys(ITEMS).filter(k=>k!=='iller')],low=s=>String(s).toLocaleLowerCase('tr').trim();
  // önce birebir ad ("Meriç" → nehir, "Meriç Deltası" değil), sonra eksiz ad
  for(const [f,n] of [[low,low(name)],[nrmName,nrmName(name)]])
    for(const l of layers){const it=(ITEMS[l]||[]).find(x=>f(x.name)===n);if(it)return it;}
  return null;
}
function revealFor(q){
  if(q.reveal)return q.reveal.map(r=>r.lon!==undefined?mk('reveal',{name:r.name,kind:'point',lon:r.lon,lat:r.lat}):findItem(r.name)).filter(Boolean);
  const ans=q.options[q.answer];
  const whole=findItem(ans);if(whole)return [whole];
  const its=ans.split(/\s+[-–]\s+/).map(findItem).filter(Boolean);
  return its.length?its:null;
}
function startExamQuiz(){
  const order=EXAM_Q.map((_,i)=>i);
  for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
  Object.assign(QUIZ,{active:true,mode:'exam',examOrder:order,idx:0,total:order.length,correct:0,wrong:0,answered:false,selOpt:-1,examQ:null,reveal:null,target:null,guess:null});
  savedLayers={...state.on};
  Object.keys(state.on).forEach(k=>state.on[k]=false);
  buildToggles();buildZones();
  document.querySelector('.modeSel').hidden=true;document.getElementById('modeExplore').hidden=true;document.getElementById('modeExam').hidden=true;
  document.getElementById('items').hidden=true;qEl.hidden=false;buildLegend();
  // kart sol menünün yerine yerleşir, harita tamamen açık kalır
  resetCardPos();appEl.classList.add('docked');panelEl.prepend(qEl);
  nextExamQ(false);
}
function nextExamQ(advance){
  if(advance)QUIZ.idx++;
  QUIZ.answered=false;QUIZ.selOpt=-1;QUIZ.reveal=null;highlight(null);panelEl.scrollTop=0;
  if(advance)resetView();
  if(QUIZ.idx>=QUIZ.total){QUIZ.examQ=null;renderQuizDone();return;}
  QUIZ.examQ=EXAM_Q[QUIZ.examOrder[QUIZ.idx]];
  renderExamCard();draw();
}
function submitExamAnswer(i){
  if(!QUIZ.active||QUIZ.answered)return;
  const q=QUIZ.examQ;
  QUIZ.answered=true;QUIZ.selOpt=i;
  if(i===q.answer)QUIZ.correct++;else QUIZ.wrong++;
  // doğru şıkkı haritada göster
  QUIZ.reveal=q.map?null:revealFor(q);
  renderExamCard();
  if(QUIZ.reveal){highlight(QUIZ.reveal);
    const b=QUIZ.reveal.reduce((a,it)=>[Math.min(a[0],it.box[0]),Math.min(a[1],it.box[1]),Math.max(a[2],it.box[2]),Math.max(a[3],it.box[3])],[1e9,1e9,-1e9,-1e9]);
    focusBox(b,QUIZ.reveal.every(it=>it.kind==='point')?3:4);}
  else draw();
}
function renderExamCard(){
  const q=QUIZ.examQ;
  let html=`<div class="qtop"><span>Soru ${QUIZ.idx+1}/${QUIZ.total}</span><span title="Net = doğru − yanlış ÷ 4">D ${QUIZ.correct} · Y ${QUIZ.wrong} · <b>Net ${fmtNet()}</b></span><button id="qClose" aria-label="Kapat">✕</button></div>`;
  html+=`<p class="qsrc">${esc(q.exam)}</p><div class="qq">${esc(q.q).replace(/\n/g,'<br>')}</div>`;
  html+='<div class="qopts">'+q.options.map((opt,i)=>{
    let cls='qopt';
    if(QUIZ.answered){if(i===q.answer)cls+=' correct';else if(i===QUIZ.selOpt)cls+=' wrong';}
    return `<button class="${cls}" data-i="${i}" ${QUIZ.answered?'disabled':''}>${String.fromCharCode(65+i)}) ${esc(opt)}</button>`;
  }).join('')+'</div>';
  if(QUIZ.answered){
    const msg=QUIZ.selOpt===q.answer?'✔ Doğru!':`✘ Olmadı — doğru cevap ${String.fromCharCode(65+q.answer)}) ${esc(q.options[q.answer])}.`;
    html+=`<div class="qres ${QUIZ.selOpt===q.answer?'ok':'no'}">${msg}</div>`;
    html+=`<div class="qbar"><button id="qNext">${QUIZ.idx+1>=QUIZ.total?'Sonuçları gör':'Sonraki soru →'}</button></div>`;
    if(q.map||QUIZ.reveal)html+='<div class="qhint">Doğru cevap haritada yeşil ile gösterildi.</div>';
  } else if(q.map){
    html+='<div class="qhint">Şıklar, haritada işaretlenen yerlere karşılık gelir.</div>';
  }
  qEl.innerHTML=html;
  document.getElementById('qClose').onclick=endQuiz;
  qEl.querySelectorAll('.qopt').forEach(b=>b.onclick=()=>submitExamAnswer(+b.dataset.i));
  if(QUIZ.answered)document.getElementById('qNext').onclick=()=>nextExamQ(true);
}
document.getElementById('examStartBtn').onclick=startExamQuiz;

buildWorld();buildToggles();refresh();
new ResizeObserver(resize).observe(svg);resize();
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{for(const k in wcache)delete wcache[k];draw();});

/* ---------- açılış ekranı ---------- */
// yenilemede eski kaydırma konumu geri gelip masaüstü düzenini kaydırmasın
if('scrollRestoration' in history)history.scrollRestoration='manual';
// Harita, fontlar ve ilk çizim hazır olana kadar splash kalır; yerleşim oturmadan görünen kaymayı gizler.
const splashEl=document.getElementById('splash');
function hideSplash(){if(hideSplash.done)return;hideSplash.done=true;
  if(splashEl){splashEl.classList.add('out');setTimeout(()=>splashEl.remove(),400);}
  setTimeout(maybeStartTour,reduce?0:300);}
(function(){
  const loaded=new Promise(r=>document.readyState==='complete'?r():addEventListener('load',r,{once:true}));
  const fonts=document.fonts&&document.fonts.ready?document.fonts.ready.catch(()=>{}):Promise.resolve();
  const frames=new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  const MIN_MS=reduce?0:1300; // sayfa açılışından itibaren, logo animasyonu tamamlansın
  Promise.all([loaded,fonts,frames]).then(()=>setTimeout(hideSplash,Math.max(0,MIN_MS-performance.now())));
  setTimeout(hideSplash,4500);
})();

/* ---------- tanıtım turu ---------- */
const TOUR_KEY='kpss-intro-v1';
const isMobile=()=>matchMedia('(max-width:900px)').matches;
const wait=ms=>new Promise(r=>setTimeout(r,reduce?0:ms));
function tourSeen(){if(store.get(TOUR_KEY)==='1')return true;try{return sessionStorage.getItem(TOUR_KEY)==='1';}catch(_){return false;}}
function markTourSeen(){if(!store.set(TOUR_KEY,'1'))try{sessionStorage.setItem(TOUR_KEY,'1');}catch(_){}}
function maybeStartTour(){if(!tourSeen())startTour();}
// panel öğesini görünür yap; mobilde yapışkan haritanın altında kalmasın
function revealEl(el){
  if(isMobile()){const top=el.getBoundingClientRect().top+scrollY-stageEl.getBoundingClientRect().height-16;window.scrollTo({top:Math.max(0,top),behavior:'auto'});}
  else scrollPanelTo(el,false);
}
function setModeTab(mode){const b=document.querySelector(`.modeBtn[data-mode="${mode}"]`);if(b&&!b.classList.contains('on'))b.click();}
const yuntIdx=()=>ITEMS.kirik.findIndex(it=>it.name==='Yunt Dağı');
const TOUR_STEPS=[
  {title:'Katmanlar',side:['right','bottom','top'],
   html:`<p>Haritada neyin görüneceğini buradan seçersin. Şu an yalnızca <b>Kırık dağlar</b> açık. Bir satıra dokunarak katmanı açıp kapatabilir, <b>Hepsini aç / Temizle</b> ile hepsini tek seferde yönetebilirsin.</p><p>Her açılışta sana rastgele <b>1–3 katmanla</b> farklı bir harita hazırlarız. Böylece her gelişinde yeni bir konuya göz atarsın.</p>`,
   enter(){Object.keys(state.on).forEach(k=>state.on[k]=k==='kirik');buildToggles();refresh();resetView();
     const el=document.querySelector('#toggles input[data-l="kirik"]').closest('.tg');revealEl(el);return el;}},
  {title:'Harita kontrolleri',side:['left','bottom'],
   html:`<ul><li><b>+ / −</b> yakınlaştırır, uzaklaştırır (fare tekerleği ya da iki parmakla da olur).</li><li><b>Tümü</b> seni Türkiye'nin tamamına geri götürür.</li><li><b>Katmanlar</b> sol menüye gitmeden katman açıp kapatmanı sağlar.</li><li><b>Soru</b> butonu Keşif Modu'nu ya da Çıkmış Sorular'ı hemen başlatır.</li></ul><p>Bir butonun ne işe yaradığını unutursan üzerine gelmen yeter.</p>`,
   enter(){closeMenus();if(isMobile())window.scrollTo({top:0,behavior:'auto'});return document.querySelector('.zoom');}},
  {title:'Haritada bir yer seç',side:['bottom','top','right','left'],
   html:`<p>İşte <b>Yunt Dağı</b>! Haritadaki bir <b>isme</b>, <b>işarete</b> ya da <b>çizgiye</b> dokunduğunda o yer yeşil ile vurgulanır ve sol menüde o yerin <b>KPSS notları</b> açılır.</p><p>Tersi de geçerli: soldaki listede bir öğeye dokunursan harita seni oraya götürür.</p>`,
   async enter(){const i=yuntIdx(),it=ITEMS.kirik[i];if(isMobile())window.scrollTo({top:0,behavior:'auto'});
     if(!state.on.kirik){state.on.kirik=true;buildToggles();refresh();}
     const [cx,cy]=[(it.box[0]+it.box[2])/2,(it.box[1]+it.box[3])/2],k=Math.min(4,Math.max(2.5,state.k)),s=fit*k;
     animateTo(k,W/2-cx*s,H/2-cy*s);await wait(430);
     highlight(it);openInfo('kirik',i);
     // vurgunun ve ismin ekran kutusu; harita her çizildiğinde yeniden hesaplanır
     return ()=>{const st=svg.getBoundingClientRect();let x1=sx(it.box[0]),y1=sy(it.box[1]),x2=sx(it.box[2]),y2=sy(it.box[3]);
       const lb=labelHits.find(h=>h.ref[0]==='kirik'&&h.ref[1]===i);if(lb){x1=Math.min(x1,lb.r.x1);y1=Math.min(y1,lb.r.y1);x2=Math.max(x2,lb.r.x2);y2=Math.max(y2,lb.r.y2);}
       return {left:st.left+x1-14,top:st.top+y1-14,width:x2-x1+28,height:y2-y1+28};};}},
  {title:'Soru sistemi: Keşif Modu',side:['right','top','bottom'],
   html:`<p>Açık katmanlardan rastgele <b>“… nerede?”</b> soruları gelir; cevabı haritaya dokunarak verirsin. Alanın içine ya da çizgiye yakın dokunuşlar doğru sayılır, ıskalarsan kaç km uzakta kaldığını görürsün.</p><p>Soru sayısını seç ve başla. Sağ üstteki <b>soru</b> butonundan da başlatabilirsin.</p>`,
   enter(){highlight(null);document.querySelectorAll('#items .sel').forEach(e=>e.classList.remove('sel'));setModeTab('explore');const el=document.querySelector('.quizbox');revealEl(el);return el;}},
  {title:'Soru sistemi: Çıkmış Sorular',side:['right','top','bottom'],
   html:`<p>Gerçek KPSS sınavlarında çıkmış coğrafya soruları, orijinal <b>A–E şıklarıyla</b>. Haritalı sorularda yerler haritada Romen rakamlarıyla işaretlenir; cevapladıktan sonra doğru yer yeşil ile gösterilir.</p><p>Doğru, yanlış ve <b>net</b> (4 yanlış 1 doğruyu götürür) canlı hesaplanır. Başarılar! 🍀</p>`,
   enter(){setModeTab('exam');const el=document.querySelector('.quizbox');revealEl(el);return el;}}
];
function tourUI(){
  if(tour.els)return tour.els;
  const mk=(tag,id)=>{const e=document.createElement(tag);e.id=id;e.hidden=true;document.body.appendChild(e);return e;};
  const els={block:mk('div','tourBlock'),hole:mk('div','tourHole'),tip:mk('div','tourTip'),welcome:mk('div','tourWelcome')};
  els.tip.setAttribute('role','dialog');els.tip.setAttribute('aria-live','polite');
  els.welcome.setAttribute('role','dialog');els.welcome.setAttribute('aria-modal','true');els.welcome.setAttribute('aria-labelledby','twTitle');
  const onScroll=()=>{if(tour.on&&tour.i>=0)requestAnimationFrame(positionTour);};
  addEventListener('resize',onScroll);addEventListener('scroll',onScroll,true);
  document.addEventListener('keydown',e=>{if(!tour.on)return;
    if(e.key==='Escape'){e.preventDefault();endTour();}
    else if(tour.i>=0&&e.key==='ArrowRight'){e.preventDefault();tourGo(tour.i+1);}
    else if(tour.i>0&&e.key==='ArrowLeft'){e.preventDefault();tourGo(tour.i-1);}});
  return tour.els=els;
}
function startTour(){
  if(tour.on)return;
  if(QUIZ.active)endQuiz();closeMenus();
  const els=tourUI();
  tour.on=true;tour.i=-1;tour.target=null;
  tour.saved={on:{...state.on},k:state.k,tx:state.tx,ty:state.ty,mode:document.querySelector('.modeBtn.on').dataset.mode,scroll:scrollY,panel:panelEl.scrollTop};
  els.block.hidden=false;els.block.className='dim';els.hole.hidden=true;els.tip.hidden=true;els.welcome.hidden=false;
  els.welcome.innerHTML=`<svg class="logo" viewBox="0 0 48 48" aria-hidden="true"><use href="#logo"/></svg>
    <h2 id="twTitle">Merhaba, hoş geldin! 👋</h2>
    <p>Bu site, KPSS Coğrafya'nın haritalı konularını tek bir etkileşimli Türkiye haritasında toplar. Ezberlemek yerine <b>görerek</b> çalışman için hazırlandı.</p>
    <ul>
      <li><span>🗺️</span><div><b>${Object.keys(LAYER_NAME).length} katman:</b> dağlar, fay hatları, ovalar, platolar, akarsular, göller, barajlar, topraklar, deprem bölgeleri, iller ve komşular.</div></li>
      <li><span>📌</span><div><b>KPSS notları:</b> haritadaki bir isme ya da işarete dokun, o yer hakkında sınavda işine yarayacak bilgiler açılsın.</div></li>
      <li><span>🧭</span><div><b>Keşif Modu:</b> “… nerede?” sorularını haritaya dokunarak cevapla.</div></li>
      <li><span>📝</span><div><b>Çıkmış Sorular:</b> gerçek KPSS coğrafya sorularını şıklı çöz, netini gör.</div></li>
    </ul>
    <p>Kısa bir turla nerede ne olduğunu gösterelim mi? Bir dakika bile sürmez.</p>
    <div class="tnav"><button class="tbtn ghost" type="button" data-a="skip">Şimdilik geç</button><button class="tbtn" type="button" data-a="go">Turu başlat →</button></div>`;
  els.welcome.querySelector('[data-a="skip"]').onclick=endTour;
  els.welcome.querySelector('[data-a="go"]').onclick=()=>tourGo(0);
  els.welcome.querySelector('[data-a="go"]').focus();
}
async function tourGo(i){
  if(!tour.on)return;
  if(i>=TOUR_STEPS.length){endTour();return;}
  const els=tour.els,step=TOUR_STEPS[i],token={};tour.token=token;tour.i=i;
  els.welcome.hidden=true;els.block.className='';els.tip.hidden=true;
  const target=await step.enter();
  if(tour.token!==token||!tour.on)return; // bu arada başka adıma geçildi
  tour.target=target;
  const last=i===TOUR_STEPS.length-1;
  els.tip.innerHTML=`<div class="st">Adım ${i+1} / ${TOUR_STEPS.length}</div><h3>${step.title}</h3>${step.html}
    <div class="tnav"><div class="dots" aria-hidden="true">${TOUR_STEPS.map((_,j)=>`<i class="${j===i?'on':''}"></i>`).join('')}</div>
    ${i>0?'<button class="tbtn ghost" type="button" data-a="prev">Geri</button>':'<button class="tbtn ghost" type="button" data-a="end">Turu kapat</button>'}
    <button class="tbtn" type="button" data-a="next">${last?'Haydi başlayalım! 🎉':'İleri →'}</button></div>`;
  els.tip.setAttribute('aria-label',step.title);
  els.tip.querySelector('[data-a="next"]').onclick=()=>tourGo(i+1);
  const pv=els.tip.querySelector('[data-a="prev"]');if(pv)pv.onclick=()=>tourGo(i-1);
  const en=els.tip.querySelector('[data-a="end"]');if(en)en.onclick=endTour;
  els.hole.hidden=false;els.tip.hidden=false;
  positionTour();
  els.tip.querySelector('[data-a="next"]').focus({preventScroll:true});
}
function positionTour(){
  if(!tour.on||tour.i<0||!tour.target)return;
  const {hole,tip}=tour.els,t=tour.target,pad=8;
  const b=typeof t==='function'?t():t.getBoundingClientRect();
  const r={left:b.left-pad,top:b.top-pad,width:b.width+pad*2,height:b.height+pad*2};r.right=r.left+r.width;r.bottom=r.top+r.height;
  Object.assign(hole.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});
  const vw=innerWidth,vh=innerHeight,tw=tip.offsetWidth,th=tip.offsetHeight,m=14,e=12;
  const fits={right:r.right+m+tw<=vw-e,left:r.left-m-tw>=e,bottom:r.bottom+m+th<=vh-e,top:r.top-m-th>=e};
  const side=TOUR_STEPS[tour.i].side.find(s=>fits[s]);let x,y;
  if(side==='right'){x=r.right+m;y=r.top;}
  else if(side==='left'){x=r.left-m-tw;y=r.top;}
  else if(side==='bottom'){x=r.left+r.width/2-tw/2;y=r.bottom+m;}
  else if(side==='top'){x=r.left+r.width/2-tw/2;y=r.top-m-th;}
  else{x=(vw-tw)/2;y=vh-th-e;} // hiçbir yana sığmıyorsa alta sabitle
  tip.style.left=Math.min(Math.max(x,e),vw-tw-e)+'px';tip.style.top=Math.min(Math.max(y,e),vh-th-e)+'px';
}
function endTour(){
  if(!tour.on)return;
  const {block,hole,tip,welcome}=tour.els,sv=tour.saved;
  tour.on=false;tour.i=-1;tour.target=null;tour.token=null;
  [block,hole,tip,welcome].forEach(e=>e.hidden=true);
  markTourSeen();
  if(sv){state.on=sv.on;buildToggles();refresh();setModeTab(sv.mode);animateTo(sv.k,sv.tx,sv.ty);
    panelEl.scrollTop=sv.panel;if(isMobile())window.scrollTo({top:sv.scroll,behavior:'auto'});}
  document.getElementById('tourAgain').blur();
}
document.getElementById('tourAgain').onclick=startTour;
