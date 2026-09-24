const REG={cx:(35.5-24.3)*77.7,cy:(43.6-39.0)*100,w:(46.6-24.4)*77.7,h:7.4*100};
const LON0=24.3, LAT1=43.6, KX=77.7, KY=100, W0=(46.0-LON0)*KX, H0=(LAT1-34.0)*KY;
const P=(lon,lat)=>[(lon-LON0)*KX,(LAT1-lat)*KY];
const invP=(x,y)=>[x/KX+LON0, LAT1-y/KY];
function distKm(lon1,lat1,lon2,lat2){
  const R=6371, la=(lat1+lat2)/2*Math.PI/180;
  const x=(lon2-lon1)*Math.PI/180*Math.cos(la), y=(lat2-lat1)*Math.PI/180;
  return Math.sqrt(x*x+y*y)*R;
}
const REGION_GEO = REGIONS.map(([full,key,color])=>{
  const meta = GEO.regionMeta[key];
  const [cx,cy] = P(meta.lon, meta.lat);
  return {full,key,color,lon:meta.lon,lat:meta.lat,cx,cy,cities:BOLGE_ILLER[key]};
});
const NEIGHBORS = (GEO.neighbors||[]).map(n=>({...n,cx:P(n.labelLon,n.labelLat)[0],cy:P(n.labelLon,n.labelLat)[1]}));
const LAKES = [
  ...GEO.lakesReal.map(l=>({name:l.name,lon:l.lon,lat:l.lat,path:l.path,real:true})),
  ...LAKES_APPROX.map(o=>({name:o[0],region:o[1],lon:o[2],lat:o[3],rx:o[4],ry:o[5],ang:o[6],real:false}))
];

const C={kirik:'#A67C00',kivrim:'#7B4A1E',volkanik:'#C62828',fay:'#D32F2F',ova:'#2F6B3A',plato:'#8C6420',masif:'#4B2E17',levha:'#3F5E78',sea:'#4B7086',city:'#22303B',goller:'#1F6E96',nehirler:'#1769AA',akarsular:'#3287B8'};
const TYPE_NAME={kirik:'Kırık dağlar',kivrim:'Kıvrım dağlar',volkanik:'Volkanik dağlar'};
const state={on:{kirik:true,kivrim:true,volkanik:true,fay:false,ova:false,masif:false,nehirler:false,akarsular:false,levha:false,iller:false,bolge:false,goller:false,komsu:false},cities:true,k:1,tx:0,ty:0};
const svg=document.getElementById('map'), world=document.getElementById('world'), over=document.getElementById('over'), note=document.getElementById('note');
let W=800,H=600,fit=1;
const ctx=document.createElement('canvas').getContext('2d');
const wcache={};
function tw(t,size,weight,italic,ls){const key=t+size+weight+italic+ls;if(wcache[key]!==undefined)return wcache[key];ctx.font=`${italic?'italic ':''}${weight} ${size}px "Instrument Sans", system-ui, sans-serif`;return wcache[key]=ctx.measureText(t).width+(ls||0)*t.length;}
const S=()=>fit*state.k;
const sx=(x)=>x*S()+state.tx, sy=(y)=>y*S()+state.ty;
const screenToLonLat=(cx,cy)=>invP((cx-state.tx)/S(),(cy-state.ty)/S());

/* ---------- world (haritanın kendisi) ---------- */
function buildWorld(){
  let h=`<rect x="-4000" y="-4000" width="9000" height="9000" fill="var(--sea)"/>`;
  h+=`<path d="${GEO.neigh}" fill="var(--neigh)" stroke="var(--border)" stroke-width="0.8" vector-effect="non-scaling-stroke"/>`;
  h+=`<path d="${GEO.tur}" fill="var(--land)" stroke="var(--tur-border)" stroke-width="1.3" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>`;
  h+=`<defs><clipPath id="turClip"><path d="${GEO.tur}"/></clipPath></defs>`;
  h+=`<g id="regions" clip-path="url(#turClip)"></g><g id="zones" clip-path="url(#turClip)"></g><g id="neighborShapes"></g><g id="faults"></g>`;
  world.innerHTML=h;
}
function ell(o,fill,stroke,op){const [x,y]=P(o[2],o[3]);return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(o[4]*KY).toFixed(1)}" ry="${(o[5]*KY).toFixed(1)}" transform="rotate(${o[6]} ${x.toFixed(1)} ${y.toFixed(1)})" fill="${fill}" fill-opacity="${op}" stroke="${stroke}" stroke-opacity=".75" stroke-width="1" stroke-dasharray="4 3" vector-effect="non-scaling-stroke"/>`;}
function buildZones(){
  document.getElementById('regions').innerHTML = state.on.bolge ? GEO.prov.map(p=>`<path d="${p.path}" fill="${p.color}" fill-opacity=".34" stroke="${p.color}" stroke-opacity=".6" stroke-width="0.7" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`).join('') : '';
  let z='';
  if(state.on.masif) MASIF.forEach(o=>z+=ell(o,C.masif,C.masif,.38));
  if(state.on.ova){OVA.forEach(o=>z+=ell(o,'#5FA267','#2F6B3A',.38));PLATO.forEach(o=>z+=ell(o,'#E2B265','#8C6420',.42));}
  if(state.on.goller){
    LAKES.forEach(l=>{if(l.real){z+=`<path d="${l.path}" fill="#4FA8D8" fill-opacity=".85" stroke="${C.goller}" stroke-width="1" vector-effect="non-scaling-stroke"/>`;}
      else{z+=ell(['',0,l.lon,l.lat,l.rx,l.ry,l.ang],'#4FA8D8',C.goller,.75);}});
  }
  const riverPath=(r)=>`M${r.pts.map(p=>P(p[0],p[1]).map(v=>v.toFixed(1)).join(',')).join('L')}`;
  if(state.on.nehirler) RIVERS.forEach(r=>{z+=`<path d="${riverPath(r)}" fill="none" stroke="#fff" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/><path d="${riverPath(r)}" fill="none" stroke="${C.nehirler}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;});
  if(state.on.akarsular) STREAMS.forEach(r=>{z+=`<path d="${riverPath(r)}" fill="none" stroke="${C.akarsular}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;});
  document.getElementById('zones').innerHTML=z;
  document.getElementById('neighborShapes').innerHTML=state.on.komsu ? NEIGHBORS.map(n=>`<path d="${n.path}" fill="${n.color}" fill-opacity=".2" stroke="#58717F" stroke-opacity=".7" stroke-width="0.8" vector-effect="non-scaling-stroke"/>`).join('') : '';
  let f='';
  if(state.on.fay) FAULTS.forEach(fl=>{const d='M'+fl.pts.map(p=>P(p[0],p[1]).map(v=>v.toFixed(1)).join(',')).join('L');
    f+=`<path d="${d}" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/><path d="${d}" fill="none" stroke="${C.fay}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;});
  document.getElementById('faults').innerHTML=f;
}

/* ---------- etiketler (ekran koordinatı) ---------- */
function overlap(a,b){return !(a.x2<b.x1||a.x1>b.x2||a.y2<b.y1||a.y1>b.y2);}
function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;');}
function renderOverlay(){
  const placed=[]; let out=''; let hidden=0;
  const labelsOn=!QUIZ.active;
  const inView=(x,y,m=60)=>x>-m&&x<W+m&&y>-m&&y<H+m;
  const free=(r)=>r.x1>4&&r.x2<W-4&&r.y1>4&&r.y2<H-4&&!placed.some(p=>overlap(r,p));
  const blockOf=(lines)=>{let w=0,h=0;lines.forEach(l=>{w=Math.max(w,tw(l.t,l.s,l.w,l.i,l.ls));h+=l.s+2;});return {w,h:h};};
  const draw=(lines,x1,y1,anchor,bw)=>{ // x1,y1 = sol üst köşe
    let y=y1,s='';
    lines.forEach(l=>{y+=l.s;const tx=anchor==='start'?x1:anchor==='end'?x1+bw:x1+bw/2;
      s+=`<text x="${tx.toFixed(1)}" y="${(y-l.s*0.18).toFixed(1)}" text-anchor="${anchor}" class="lb" font-size="${l.s}" font-weight="${l.w}" ${l.i?'font-style="italic"':''} ${l.ls?`letter-spacing="${l.ls}"`:''} fill="${l.c}">${esc(l.t)}</text>`;y+=2;});
    return s;};
  // marker rezervasyonları
  const cityVisible=new Map();
  const faultOva=state.cities&&(state.on.fay||state.on.ova);
  const wantCities=faultOva||state.on.iller;
  if(wantCities){
    const names=new Set();
    if(faultOva&&state.on.fay) FAULTS.forEach(f=>f.cities.forEach(c=>names.add(c)));
    if(faultOva&&state.on.ova){OVA.concat(PLATO).forEach(o=>o[7].forEach(c=>names.add(c)));}
    if(state.on.iller) ILLER.forEach(c=>names.add(c));
    names.forEach(n=>{const c=CITY[n];if(!c)return;const [wx,wy]=P(c[0],c[1]);const x=sx(wx),y=sy(wy);if(inView(x,y))cityVisible.set(n,[x,y]);});
    cityVisible.forEach(([x,y])=>placed.push({x1:x-3.5,y1:y-3.5,x2:x+3.5,y2:y+3.5}));
  }
  // dağ işaretleri
  const mts=MOUNTAINS.filter(m=>state.on[m[1]]);
  const mpos=mts.map(m=>{const [wx,wy]=P(m[2],m[3]);return [m,sx(wx),sy(wy)];}).filter(([m,x,y])=>inView(x,y));
  mpos.forEach(([m,x,y])=>placed.push({x1:x-7,y1:y-7,x2:x+7,y2:y+7}));
  // göl işaretleri
  const lpos = state.on.goller ? LAKES.map(l=>{const [wx,wy]=P(l.lon,l.lat);return [l,sx(wx),sy(wy)];}).filter(([l,x,y])=>inView(x,y)) : [];
  lpos.forEach(([l,x,y])=>placed.push({x1:x-6,y1:y-6,x2:x+6,y2:y+6}));
  // 0) bölgeler
  if(state.on.bolge&&labelsOn) REGION_GEO.forEach(g=>{const x=sx(g.cx),y=sy(g.cy);if(!inView(x,y,150))return;
    const fs=W<480?10.5:12.5;const l=[{t:g.full.toUpperCase(),s:fs,w:800,i:false,ls:W<480?0.6:1.2,c:g.color}];const b=blockOf(l);
    const cands=[[x-b.w/2,y-b.h/2],[x-b.w/2,y-b.h/2-34],[x-b.w/2,y-b.h/2+34],[x-b.w/2-56,y-b.h/2],[x-b.w/2+56,y-b.h/2],
      [x-b.w/2,y-b.h/2-64],[x-b.w/2,y-b.h/2+64],[x-b.w/2-56,y-b.h/2-34],[x-b.w/2+56,y-b.h/2-34],[x-b.w/2-56,y-b.h/2+34],[x-b.w/2+56,y-b.h/2+34]];
    let pick=null;for(const c of cands){const r={x1:c[0]-3,y1:c[1]-2,x2:c[0]+b.w+3,y2:c[1]+b.h+2};if(free(r)){pick=c;placed.push(r);break;}}
    if(!pick){pick=cands[0];placed.push({x1:pick[0]-3,y1:pick[1]-2,x2:pick[0]+b.w+3,y2:pick[1]+b.h+2});}
    out+=draw(l,pick[0],pick[1],'start',b.w);});
  // 1) levhalar
  if(state.on.levha&&labelsOn) PLATES.forEach(p=>{const [wx,wy]=P(p[1],p[2]);const x=sx(wx),y=sy(wy);if(!inView(x,y,200))return;
    const l=[{t:p[0],s:17,w:700,i:false,ls:2.5,c:C.levha}];const b=blockOf(l);out+=draw(l,x-b.w/2,y-b.h/2,'middle',b.w);placed.push({x1:x-b.w/2,y1:y-b.h/2,x2:x+b.w/2,y2:y+b.h/2});});
  // 4) şehirler
  if(wantCities){
    const order=[];
    if(faultOva&&state.on.fay) FAULTS.forEach(f=>f.cities.forEach(c=>order.push(c)));
    if(faultOva&&state.on.ova) OVA.concat(PLATO).forEach(o=>o[7].forEach(c=>order.push(c)));
    if(state.on.iller) ILLER.forEach(c=>order.push(c));
    const seen=new Set();
    order.forEach(n=>{if(seen.has(n)||!cityVisible.has(n))return;seen.add(n);
      const [x,y]=cityVisible.get(n);const onFault=faultOva&&state.on.fay&&FAULTS.some(f=>f.cities.includes(n));
      out+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.4" fill="${C.city}" stroke="${onFault?C.fay:'#fff'}" stroke-width="1.6"/>`;
      if(!labelsOn)return;
      const l=[{t:n,s:10.5,w:700,i:false,c:C.city}];const b=blockOf(l);
      const cands=[[x+7,y-b.h/2],[x-7-b.w,y-b.h/2],[x-b.w/2,y-b.h-6],[x-b.w/2,y+6],[x+7,y-b.h-3],[x+7,y+3]];
      let ok=null;for(const c of cands){const r={x1:c[0]-2,y1:c[1]-1,x2:c[0]+b.w+2,y2:c[1]+b.h+1};if(free(r)){ok=c;placed.push(r);break;}}
      if(ok)out+=draw(l,ok[0],ok[1],'start',b.w);else hidden++;});
  }
  // 2) masif / ova / plato merkezli bloklar
  const zoneItems=[];
  if(state.on.masif) MASIF.forEach(o=>zoneItems.push([o,C.masif,[]]));
  if(state.on.ova){OVA.forEach(o=>zoneItems.push([o,C.ova,o[7]]));PLATO.forEach(o=>zoneItems.push([o,C.plato,o[7]]));}
  if(labelsOn) zoneItems.forEach(([o,col])=>{const [wx,wy]=P(o[2],o[3]);const x=sx(wx),y=sy(wy);if(!inView(x,y,120))return;
    const lines=[{t:o[0],s:12.5,w:700,i:false,c:col}];const b=blockOf(lines);
    const cands=[[0,0],[0,-b.h-6],[0,b.h+6],[b.w*0.55,0],[-b.w*0.55,0],[b.w*0.55,-b.h-4],[-b.w*0.55,-b.h-4],[b.w*0.55,b.h+4],[-b.w*0.55,b.h+4],
      [0,-b.h-30,1],[0,b.h+30,1],[b.w*0.6+20,-b.h,1],[-b.w*0.6-20,-b.h,1],[b.w*0.6+20,b.h,1],[-b.w*0.6-20,b.h,1],[0,-2*b.h-40,1],[0,2*b.h+40,1]];
    let pick=null;for(const c of cands){const r={x1:x+c[0]-b.w/2-2,y1:y+c[1]-b.h/2-2,x2:x+c[0]+b.w/2+2,y2:y+c[1]+b.h/2+2};if(free(r)){pick=c;placed.push(r);break;}}
    if(!pick){pick=cands[0];placed.push({x1:x-b.w/2,y1:y-b.h/2,x2:x+b.w/2,y2:y+b.h/2});}
    if(pick[2]){const lx=Math.min(Math.max(x,x+pick[0]-b.w/2),x+pick[0]+b.w/2),ly=Math.min(Math.max(y,y+pick[1]-b.h/2),y+pick[1]+b.h/2);
      out+=`<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${lx.toFixed(1)}" y2="${ly.toFixed(1)}" stroke="${col}" stroke-opacity=".75" stroke-width="1"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2" fill="${col}"/>`;}
    out+=draw(lines,x+pick[0]-b.w/2,y+pick[1]-b.h/2,'middle',b.w);});
  // 3) dağ etiketleri
  mpos.forEach(([m,x,y])=>{const col=C[m[1]];
    const marker=m[4]==='graben'?`M${x-6.5},${y-5}H${x+6.5}L${x},${y+6}Z`:`M${x},${y-6}L${x+6.5},${y+5}H${x-6.5}Z`;
    out+=`<path d="${marker}" fill="${col}" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/>`;
    if(!labelsOn)return;
    const l=[{t:m[0],s:12.5,w:700,i:false,c:col}];const b=blockOf(l);
    const h2=b.h/2;
    const cands=[[x+9,y-h2],[x-9-b.w,y-h2],[x-b.w/2,y-b.h-8],[x-b.w/2,y+8],[x+7,y-b.h-6],[x-7-b.w,y-b.h-6],[x+7,y+6],[x-7-b.w,y+6],
      [x+34,y-h2-16,1],[x+34,y-h2+16,1],[x-34-b.w,y-h2-16,1],[x-34-b.w,y-h2+16,1],[x-b.w/2,y-b.h-30,1],[x-b.w/2,y+30,1],[x+40,y-h2-34,1],[x-40-b.w,y-h2+34,1],[x+40,y-h2+34,1],[x-40-b.w,y-h2-34,1]];
    let pick=null;for(const c of cands){const r={x1:c[0]-2,y1:c[1]-1,x2:c[0]+b.w+2,y2:c[1]+b.h+1};if(free(r)){pick=c;placed.push(r);break;}}
    if(pick){if(pick[2]){const lx=Math.min(Math.max(x,pick[0]),pick[0]+b.w),ly=Math.min(Math.max(y,pick[1]),pick[1]+b.h);
        out+=`<line x1="${x}" y1="${y}" x2="${lx.toFixed(1)}" y2="${ly.toFixed(1)}" stroke="${col}" stroke-opacity=".7" stroke-width="1"/>`;}
      out+=draw(l,pick[0],pick[1],'start',b.w);}else hidden++;});
  // 3b) göl etiketleri
  lpos.forEach(([l,x,y])=>{
    out+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.2" fill="#4FA8D8" stroke="${C.goller}" stroke-width="1.4"/>`;
    if(!labelsOn)return;
    const ll=[{t:l.name,s:12,w:700,i:false,c:C.goller}];const b=blockOf(ll);const h2=b.h/2;
    const cands=[[x+9,y-h2],[x-9-b.w,y-h2],[x-b.w/2,y-b.h-8],[x-b.w/2,y+8],[x+34,y-h2-16,1],[x-34-b.w,y-h2+16,1]];
    let pick=null;for(const c of cands){const r={x1:c[0]-2,y1:c[1]-1,x2:c[0]+b.w+2,y2:c[1]+b.h+1};if(free(r)){pick=c;placed.push(r);break;}}
    if(pick){if(pick[2]){const lx=Math.min(Math.max(x,pick[0]),pick[0]+b.w),ly=Math.min(Math.max(y,pick[1]),pick[1]+b.h);
        out+=`<line x1="${x}" y1="${y}" x2="${lx.toFixed(1)}" y2="${ly.toFixed(1)}" stroke="${C.goller}" stroke-opacity=".7" stroke-width="1"/>`;}
      out+=draw(ll,pick[0],pick[1],'start',b.w);}else hidden++;});
  // 3c) komşu ülke etiketleri
  if(state.on.komsu&&labelsOn) NEIGHBORS.forEach(n=>{
    const x=sx(n.cx),y=sy(n.cy);if(!inView(x,y,120))return;
    const l=[{t:n.name,s:11.5,w:700,i:false,c:'#385565'}];const b=blockOf(l);const h2=b.h/2;
    const cands=[[x-b.w/2,y-h2],[x-b.w/2,y-h2-24],[x-b.w/2,y+h2+8],[x+8,y-h2],[x-8-b.w,y-h2]];
    let pick=null;for(const c of cands){const r={x1:c[0]-2,y1:c[1]-1,x2:c[0]+b.w+2,y2:c[1]+b.h+1};if(free(r)){pick=c;placed.push(r);break;}}
    if(pick)out+=draw(l,pick[0],pick[1],'start',b.w);else hidden++;
  });
  const riverLabels=(state.on.nehirler?RIVERS:[]).concat(state.on.akarsular?STREAMS:[]);
  riverLabels.forEach(r=>{
    const p=r.pts[Math.floor(r.pts.length/2)], [wx,wy]=P(p[0],p[1]), x=sx(wx), y=sy(wy);
    if(!inView(x,y,80)||!labelsOn)return;
    const col=RIVERS.includes(r)?C.nehirler:C.akarsular;
    const ll=[{t:r.name,s:11.5,w:700,i:true,c:col}],b=blockOf(ll);
    const rbox={x1:x-b.w/2-2,y1:y-b.h/2-1,x2:x+b.w/2+2,y2:y+b.h/2+1};
    if(free(rbox)){placed.push(rbox);out+=draw(ll,x-b.w/2,y-b.h/2,'start',b.w);}
  });
  // 5) deniz adları
  SEAS.forEach(s=>{const [wx,wy]=P(s[1],s[2]);const x=sx(wx),y=sy(wy);if(!inView(x,y,100))return;
    const l=[{t:s[0],s:12,w:500,i:true,ls:2.5,c:C.sea}];const b=blockOf(l);const r={x1:x-b.w/2,y1:y-b.h/2,x2:x+b.w/2,y2:y+b.h/2};
    if(free(r)){out+=draw(l,x-b.w/2,y-b.h/2,'middle',b.w);placed.push(r);}});
  // 6) quiz işaretleri
  if(QUIZ.active&&QUIZ.answered&&QUIZ.guess){
    const [gx,gy]=P(QUIZ.guess[0],QUIZ.guess[1]),[tx,ty]=P(QUIZ.target.lon,QUIZ.target.lat);
    const gsx=sx(gx),gsy=sy(gy),tsx=sx(tx),tsy=sy(ty);
    out+=`<line x1="${gsx.toFixed(1)}" y1="${gsy.toFixed(1)}" x2="${tsx.toFixed(1)}" y2="${tsy.toFixed(1)}" stroke="#333" stroke-width="1.4" stroke-dasharray="4 3"/>`;
    out+=`<g stroke="#fff" stroke-width="1.6"><path d="M${gsx-7},${gsy-7}L${gsx+7},${gsy+7}M${gsx-7},${gsy+7}L${gsx+7},${gsy-7}" stroke="#C62828" stroke-width="3.2" stroke-linecap="round"/></g>`;
    out+=`<circle cx="${tsx.toFixed(1)}" cy="${tsy.toFixed(1)}" r="8" fill="none" stroke="#1E8F4E" stroke-width="3"/><circle cx="${tsx.toFixed(1)}" cy="${tsy.toFixed(1)}" r="2.4" fill="#1E8F4E"/>`;
  }
  over.innerHTML=out;
  note.textContent=hidden>0?`${hidden} ad sığmadığı için gizlendi. Yakınlaştırınca görünür.`:'';
  note.hidden=hidden===0||QUIZ.active;
}

/* ---------- görünüm ---------- */
function apply(){world.setAttribute('transform',`translate(${state.tx.toFixed(2)} ${state.ty.toFixed(2)}) scale(${S().toFixed(4)})`);}
let raf=0;function draw(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;apply();renderOverlay();});}
function resize(){const r=svg.getBoundingClientRect();W=Math.max(300,r.width);H=Math.max(300,r.height);svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
  const oldFit=fit;fit=Math.min(W/REG.w,H/REG.h)*0.98;if(!resize.done||state.k===1){resetView();resize.done=true;}else{draw();}}
function home(){return [1,W/2-REG.cx*fit,H/2-REG.cy*fit];}
function resetView(){const h=home();state.k=1;state.tx=h[1];state.ty=h[2];draw();}
function zoomAt(f,cx,cy){const nk=Math.min(14,Math.max(1,state.k*f));const r=nk/state.k;state.tx=cx-(cx-state.tx)*r;state.ty=cy-(cy-state.ty)*r;state.k=nk;draw();}
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
function animateTo(k,tx,ty){if(reduce){state.k=k;state.tx=tx;state.ty=ty;draw();return;}
  const k0=state.k,x0=state.tx,y0=state.ty,t0=performance.now();(function step(t){const u=Math.min(1,(t-t0)/380),e=1-Math.pow(1-u,3);
    state.k=k0+(k-k0)*e;state.tx=x0+(tx-x0)*e;state.ty=y0+(ty-y0)*e;apply();renderOverlay();if(u<1)requestAnimationFrame(step);})(t0);}
function focusOn(pts,minK){let x1=1e9,y1=1e9,x2=-1e9,y2=-1e9;pts.forEach(p=>{const [x,y]=P(p[0],p[1]);x1=Math.min(x1,x);x2=Math.max(x2,x);y1=Math.min(y1,y);y2=Math.max(y2,y);});
  const w=Math.max(x2-x1,90),h=Math.max(y2-y1,70);let k=Math.min(W/(w*fit*1.5),H/(h*fit*1.5));k=pts.length===1?(minK||3):Math.min(10,Math.max(1,k));
  const s=fit*k;animateTo(k,W/2-(x1+x2)/2*s,H/2-(y1+y2)/2*s);
  if(matchMedia('(max-width:900px)').matches){
    document.getElementById('stage').scrollIntoView({block:'start',behavior:reduce?'auto':'smooth'});
  }}

/* ---------- etkileşim ---------- */
const ptrs=new Map();let lastD=0,downPt=null,moveDist=0;
svg.addEventListener('pointerdown',e=>{svg.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,[e.clientX,e.clientY]);lastD=0;svg.classList.add('drag');
  if(ptrs.size===1){downPt=[e.clientX,e.clientY];moveDist=0;}});
svg.addEventListener('pointermove',e=>{if(!ptrs.has(e.pointerId))return;const p=ptrs.get(e.pointerId);
  if(ptrs.size===1){const dx=e.clientX-p[0],dy=e.clientY-p[1];state.tx+=dx;state.ty+=dy;ptrs.set(e.pointerId,[e.clientX,e.clientY]);moveDist+=Math.hypot(dx,dy);draw();}
  else if(ptrs.size===2){ptrs.set(e.pointerId,[e.clientX,e.clientY]);const [a,b]=[...ptrs.values()];const d=Math.hypot(a[0]-b[0],a[1]-b[1]);const r=svg.getBoundingClientRect();
    if(lastD)zoomAt(d/lastD,(a[0]+b[0])/2-r.left,(a[1]+b[1])/2-r.top);lastD=d;}});
const up=e=>{const wasSingle=ptrs.size===1;ptrs.delete(e.pointerId);lastD=0;if(!ptrs.size)svg.classList.remove('drag');
  if(wasSingle&&QUIZ.active&&!QUIZ.answered&&moveDist<6){const r=svg.getBoundingClientRect();submitGuess(e.clientX-r.left,e.clientY-r.top);}
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
const swatch={kirik:`<svg width="16" height="14" viewBox="0 0 16 14"><path d="M8 1L15 13H1Z" fill="${C.kirik}"/></svg>`,kivrim:`<svg width="16" height="14" viewBox="0 0 16 14"><path d="M8 1L15 13H1Z" fill="${C.kivrim}"/></svg>`,volkanik:`<svg width="16" height="14" viewBox="0 0 16 14"><path d="M8 1L15 13H1Z" fill="${C.volkanik}"/></svg>`,
 fay:`<svg width="16" height="14" viewBox="0 0 16 14"><path d="M1 12L6 6L10 9L15 2" fill="none" stroke="${C.fay}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
 ova:`<svg width="16" height="14" viewBox="0 0 16 14"><ellipse cx="6" cy="7" rx="5" ry="4" fill="#5FA267" fill-opacity=".7" stroke="#2F6B3A" stroke-dasharray="2 1.5"/><ellipse cx="11" cy="8" rx="4" ry="3.5" fill="#E2B265" fill-opacity=".8" stroke="#8C6420" stroke-dasharray="2 1.5"/></svg>`,
 masif:`<svg width="16" height="14" viewBox="0 0 16 14"><ellipse cx="8" cy="7" rx="7" ry="5" fill="${C.masif}" fill-opacity=".7" stroke="${C.masif}" stroke-dasharray="2 1.5"/></svg>`,
 iller:`<svg width="16" height="14" viewBox="0 0 16 14"><circle cx="5" cy="5" r="2.4" fill="#22303B"/><circle cx="11" cy="8" r="2.4" fill="#22303B"/><circle cx="5" cy="11" r="2" fill="#22303B"/></svg>`,
 bolge:`<svg width="16" height="14" viewBox="0 0 16 14"><path d="M2 9 Q1 3 8 3 Q15 3 14 9 Q13 12 8 12 Q3 12 2 9Z" fill="#3D6EA5" fill-opacity=".45" stroke="#3D6EA5" stroke-dasharray="2 1.3"/></svg>`,
 goller:`<svg width="16" height="14" viewBox="0 0 16 14"><ellipse cx="8" cy="8" rx="6.5" ry="4.5" fill="#4FA8D8" fill-opacity=".85" stroke="${C.goller}"/></svg>`,
 nehirler:`<svg width="16" height="14" viewBox="0 0 16 14"><path d="M1 11C5 2 10 13 15 3" fill="none" stroke="${C.nehirler}" stroke-width="2.5"/></svg>`,
 akarsular:`<svg width="16" height="14" viewBox="0 0 16 14"><path d="M1 11C5 2 10 13 15 3" fill="none" stroke="${C.akarsular}" stroke-width="1.8"/></svg>`,
 levha:`<svg width="16" height="14" viewBox="0 0 16 14"><text x="8" y="11" text-anchor="middle" font-size="12" font-weight="700" fill="#9FC2DD" font-family="serif">L</text></svg>`,
 komsu:`<svg width="16" height="14" viewBox="0 0 16 14"><path d="M1 3h14v8H1Z" fill="#6D8594" fill-opacity=".35" stroke="#58717F"/></svg>`};
const LAYERS=[['kirik','Kırık dağlar','koyu sarı'],['kivrim','Kıvrım dağlar','kahverengi'],['volkanik','Volkanik dağlar','kırmızı'],['fay','Fay hatları','şehirlerle'],['ova','Ova ve platolar','bölge ve şehirlerle'],['masif','Masifler','koyu kahverengi'],['nehirler','Nehirler','başlıca akarsular'],['akarsular','Akarsular','nehir kolları'],['goller','Göller','doğal göller'],['bolge','Bölgeler','il sınırlarıyla'],['komsu','Komşularımız','8 ülke · Natural Earth'],['levha','Levhalar','yalnızca isim'],['iller','Tüm iller','81 il adı']];
function buildToggles(){
  const el=document.getElementById('toggles');
  el.innerHTML=LAYERS.map(([id,t,s])=>`<label class="tg"><input type="checkbox" data-l="${id}" ${state.on[id]?'checked':''}><span class="sw">${swatch[id]}</span><span class="tt"><b>${t}</b><small>${s}</small></span></label>`).join('');
  el.querySelectorAll('input').forEach(i=>i.onchange=()=>{state.on[i.dataset.l]=i.checked;refresh();});
}
function refresh(){buildZones();buildList();draw();document.getElementById('citiesRow').hidden=!(state.on.fay||state.on.ova);}
function bl(ul){return `<ul>${ul.map(t=>`<li>${t}</li>`).join('')}</ul>`;}
function gen(key){const g=GENERAL[key];return g?`<details class="gen"><summary>KPSS genel bilgiler</summary>${bl(g)}</details>`:'';}
function item(id,name,color,sub,kind){const n=NOTES[name];
  const mark=kind==='ln'?'<i class="ln"></i>':'<i class="dot"></i>';
  return `<li><button data-f="${id}" style="--c:${color}" aria-expanded="false">${mark}<span>${name}${sub?`<small>${sub}</small>`:''}</span>${n?'<em class="chev" aria-hidden="true"></em>':''}</button>${n?`<div class="kp" style="--c:${color}" hidden><b>KPSS notları</b>${bl(n)}</div>`:''}</li>`;}
function buildList(){
  const box=document.getElementById('items');let h='';
  const sec=(title,g,rows)=>rows.length?`<section><h3>${title}</h3>${gen(g)}<ul class="lst">${rows.join('')}</ul></section>`:'';
  if(state.on.bolge) h+=sec('Bölgeler','bolge',REGION_GEO.map((g,i)=>item('b'+i,g.full,g.color,g.cities.length+' il')));
  ['kirik','kivrim','volkanik'].forEach(t=>{if(!state.on[t])return;
    if(t==='kirik'){
      const horst=MOUNTAINS.map((m,i)=>[m,i]).filter(([m])=>m[1]===t&&m[4]!=='graben').map(([m,i])=>item('m'+i,m[0],C[t],'Horst'));
      const graben=MOUNTAINS.map((m,i)=>[m,i]).filter(([m])=>m[1]===t&&m[4]==='graben').map(([m,i])=>item('m'+i,m[0],C[t],'Graben','ln'));
      h+=sec('Kırık dağlar · Horstlar',t,horst)+sec('Kırık dağlar · Grabenler',t,graben);
    } else {
      const rows=MOUNTAINS.map((m,i)=>[m,i]).filter(([m])=>m[1]===t).map(([m,i])=>item('m'+i,m[0],C[t],''));h+=sec(TYPE_NAME[t],t,rows);
    }});
  if(state.on.fay) h+=sec('Fay hatları','fay',FAULTS.map((f,i)=>item('f'+i,f.name,C.fay,f.cities.join(', '),'ln')));
  if(state.on.ova){
    h+=sec('Ovalar','ova',OVA.map((o,i)=>item('o'+i,o[0],C.ova,'')));
    h+=sec('Platolar','plato',PLATO.map((o,i)=>item('p'+i,o[0],C.plato,'')));}
  if(state.on.masif) h+=sec('Masifler','masif',MASIF.map((o,i)=>item('s'+i,o[0],C.masif,o[1])));
  if(state.on.goller) h+=sec('Göller','goller',LAKES.map((l,i)=>item('g'+i,l.name,C.goller,l.region||'')));
  if(state.on.nehirler) h+=sec('Nehirler','nehirler',RIVERS.map((r,i)=>item('r'+i,r.name,C.nehirler,r.basin,'ln')));
  if(state.on.akarsular) h+=sec('Akarsular · kollar','akarsular',STREAMS.map((r,i)=>item('a'+i,r.name,C.akarsular,r.basin,'ln')));
  if(state.on.komsu) h+=sec('Komşularımız','komsu',NEIGHBORS.map((n,i)=>item('n'+i,n.name,n.color,'kara sınırı')));
  if(state.on.levha) h+=sec('Levhalar','levha',PLATES.map((o,i)=>item('l'+i,o[0],C.levha,'')));
  if(state.on.iller){h+=`<section><h3>İller (81)</h3>${gen('iller')}`;
    Object.keys(BOLGE_ILLER).forEach(r=>{h+=`<p class="reg">${r} Bölgesi <span>${BOLGE_ILLER[r].length} il</span></p><div class="chips">${BOLGE_ILLER[r].map(n=>`<button class="chip" data-c="${n}">${n}</button>`).join('')}</div>`;});h+='</section>';}
  box.innerHTML=(h?`<p class="disc">Notlar KPSS coğrafya konu kalıplarına göre derlenmiştir. Belirli sınav yıllarını ve soru numaralarını doğrulayamadığım için sorulmuş soruyu değil, sık sorulan bilgileri veriyorum. Ders kitabınızla karşılaştırmanızı öneririm.</p>`:'')+ (h||'<p class="empty">Haritada göstermek için soldan bir katman seçin.</p>');
  box.querySelectorAll('.lst button').forEach(b=>b.onclick=()=>{const k=b.dataset.f[0],i=+b.dataset.f.slice(1);
    const kp=b.nextElementSibling;const open=kp&&!kp.hidden;
    box.querySelectorAll('.kp').forEach(e=>e.hidden=true);box.querySelectorAll('.lst button').forEach(e=>e.setAttribute('aria-expanded','false'));
    if(kp&&!open){kp.hidden=false;b.setAttribute('aria-expanded','true');}
    if(k==='m')focusOn([[MOUNTAINS[i][2],MOUNTAINS[i][3]]],4);
    else if(k==='f')focusOn(FAULTS[i].pts,2);
    else if(k==='o')focusOn([[OVA[i][2],OVA[i][3]]],4);
    else if(k==='p')focusOn([[PLATO[i][2],PLATO[i][3]]],4);
    else if(k==='s')focusOn([[MASIF[i][2],MASIF[i][3]]],3.5);
    else if(k==='b')focusOn(REGION_GEO[i].cities.map(n=>CITY[n]),1.05);
    else if(k==='g')focusOn([[LAKES[i].lon,LAKES[i].lat]],5.5);
    else if(k==='r')focusOn(RIVERS[i].pts,2.5);
    else if(k==='a')focusOn(STREAMS[i].pts,2.5);
    else if(k==='n')focusOn([[NEIGHBORS[i].labelLon,NEIGHBORS[i].labelLat]],2.5);
    else focusOn([[PLATES[i][1],PLATES[i][2]]],2);});
  box.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{const c=CITY[b.dataset.c];focusOn([[c[0],c[1]]],5);});
}
document.getElementById('showCities').onchange=e=>{state.cities=e.target.checked;draw();};
document.getElementById('all').onclick=()=>{Object.keys(state.on).forEach(k=>state.on[k]=true);buildToggles();refresh();};
document.getElementById('none').onclick=()=>{Object.keys(state.on).forEach(k=>state.on[k]=false);buildToggles();refresh();};

/* ---------- quiz ---------- */
const QUIZ={active:false,pool:[],idx:0,total:8,correct:0,answered:false,guess:null,target:null};
const TOL={kirik:45,kivrim:45,volkanik:45,ova:55,plato:70,masif:80,levha:320,iller:45,bolge:200,goller:35,komsu:100,nehirler:60,akarsular:50};
function poolFromCat(cat){
  if(cat==='kirik'||cat==='kivrim'||cat==='volkanik') return MOUNTAINS.filter(m=>m[1]===cat).map(m=>({name:m[0],lon:m[2],lat:m[3],cat,tol:TOL[cat]}));
  if(cat==='ova') return OVA.map(o=>({name:o[0],lon:o[2],lat:o[3],cat,tol:TOL.ova}));
  if(cat==='plato') return PLATO.map(o=>({name:o[0],lon:o[2],lat:o[3],cat,tol:TOL.plato}));
  if(cat==='masif') return MASIF.map(o=>({name:o[0],lon:o[2],lat:o[3],cat,tol:TOL.masif}));
  if(cat==='levha') return PLATES.map(p=>({name:p[0],lon:p[1],lat:p[2],cat,tol:TOL.levha}));
  if(cat==='iller') return ILLER.map(n=>({name:n,lon:CITY[n][0],lat:CITY[n][1],cat,tol:TOL.iller}));
  if(cat==='bolge') return REGION_GEO.map(g=>({name:g.full,lon:g.lon,lat:g.lat,cat,tol:TOL.bolge}));
  if(cat==='goller') return LAKES.map(l=>({name:l.name,lon:l.lon,lat:l.lat,cat,tol:TOL.goller}));
  if(cat==='nehirler'||cat==='akarsular') return (cat==='nehirler'?RIVERS:STREAMS).map(r=>({name:r.name,lon:r.pts[Math.floor(r.pts.length/2)][0],lat:r.pts[Math.floor(r.pts.length/2)][1],cat,tol:TOL[cat]}));
  if(cat==='komsu') return NEIGHBORS.map(n=>({name:n.name,lon:n.labelLon,lat:n.labelLat,cat,tol:TOL.komsu}));
  return [];
}
function buildQuizPool(){
  let cats=Object.keys(state.on).filter(k=>state.on[k]&&k!=='fay');
  if(state.on.ova) cats.push('plato');
  if(!cats.length) cats=['kirik','kivrim','volkanik','ova','plato','masif','goller','iller','bolge','levha'];
  let pool=[]; cats.forEach(c=>pool=pool.concat(poolFromCat(c)));
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  return pool;
}
const qEl=document.getElementById('quizcard');
function startQuiz(n){
  const pool=buildQuizPool();
  QUIZ.active=true;QUIZ.pool=pool.slice(0,Math.min(n,pool.length));QUIZ.total=QUIZ.pool.length;QUIZ.idx=0;QUIZ.correct=0;QUIZ.answered=false;QUIZ.guess=null;QUIZ.target=null;
  document.getElementById('quizStart').hidden=true;
  qEl.hidden=false;
  nextQ(false);
  draw();
}
function nextQ(advance){
  if(advance)QUIZ.idx++;
  QUIZ.answered=false;QUIZ.guess=null;
  if(QUIZ.idx>=QUIZ.total){renderQuizDone();return;}
  QUIZ.target=QUIZ.pool[QUIZ.idx];
  renderQuizCard();
  draw();
}
function submitGuess(cx,cy){
  if(!QUIZ.active||QUIZ.answered)return;
  const [lon,lat]=screenToLonLat(cx,cy);
  QUIZ.guess=[lon,lat];QUIZ.answered=true;
  const d=distKm(lon,lat,QUIZ.target.lon,QUIZ.target.lat);
  const ok=d<=QUIZ.target.tol;
  if(ok)QUIZ.correct++;
  renderQuizCard(d,ok);
  draw();
}
function renderQuizCard(d,ok){
  const t=QUIZ.target;
  let html=`<div class="qtop"><span>Soru ${QUIZ.idx+1}/${QUIZ.total}</span><span>Puan: ${QUIZ.correct}</span><button id="qClose" aria-label="Kapat">✕</button></div>`;
  html+=`<div class="qq">“<b>${esc(t.name)}</b>” nerede? Haritada işaretle.</div>`;
  if(QUIZ.answered){
    const dist=d.toFixed(0);
    html+=`<div class="qres ${ok?'ok':'no'}">${ok?'✔ Doğru civar!':'✘ Biraz uzak'} — tahminin gerçek yere <b>${dist} km</b> uzaklıktaydı.</div>`;
    html+=`<div class="qbar"><button id="qNext">${QUIZ.idx+1>=QUIZ.total?'Sonuçları gör':'Sonraki soru →'}</button></div>`;
  } else {
    html+=`<div class="qhint">Haritaya dokun / tıkla.</div>`;
  }
  qEl.innerHTML=html;
  document.getElementById('qClose').onclick=endQuiz;
  if(QUIZ.answered)document.getElementById('qNext').onclick=()=>nextQ(true);
}
function renderQuizDone(){
  const pct=Math.round(100*QUIZ.correct/QUIZ.total);
  qEl.innerHTML=`<div class="qtop"><span>Sonuç</span><button id="qClose" aria-label="Kapat">✕</button></div>
    <div class="qdone"><div class="qscore">${QUIZ.correct}/${QUIZ.total}</div><div>doğru (%${pct})</div></div>
    <div class="qbar"><button id="qAgain">Tekrar oyna</button><button id="qStop" class="ghost">Bitir</button></div>`;
  document.getElementById('qClose').onclick=endQuiz;
  document.getElementById('qAgain').onclick=()=>startQuiz(QUIZ.pool.length||8);
  document.getElementById('qStop').onclick=endQuiz;
  QUIZ.answered=false;QUIZ.guess=null;draw();
}
function endQuiz(){QUIZ.active=false;QUIZ.answered=false;QUIZ.guess=null;qEl.hidden=true;document.getElementById('quizStart').hidden=false;draw();}
document.querySelectorAll('.qn').forEach(b=>b.onclick=()=>startQuiz(+b.dataset.n));

buildWorld();buildToggles();buildZones();buildList();
new ResizeObserver(resize).observe(svg);resize();
document.getElementById('citiesRow').hidden=true;
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{for(const k in wcache)delete wcache[k];draw();});
