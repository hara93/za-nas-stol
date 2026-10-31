/* Procurement uses recipe base units: g, ml, or edible grams for piece-based foods. */
const STORAGE_LABELS = {pantry:'Za ostavu',freezer:'Za zamrzivač',fresh:'Kupuj svježe'};
function shoppingPolicy(iid) {
  const base=SHOP_DEFAULTS[iid] || {packSize:0,storage:'fresh',note:''};
  const saved=((settings().shoppingPrefs || {}).items || {})[iid] || {};
  const pack=Number(saved.packSize ?? base.packSize);
  return {...base,...saved,packSize:Number.isFinite(pack)&&pack>=0?pack:base.packSize,storage:STORAGE_LABELS[saved.storage]?saved.storage:base.storage};
}
const shoppingWeeks = start => Array.from({length:4},(_,i)=>isoDate(addDays(parseDate(start),7*i)));
const shoppingRange = start => `${fmtDate(start)} – ${fmtDate(isoDate(addDays(parseDate(start),27)))}`;
const shopDocPath = (mode,start) => `${mode==='month'?'shopping-month':'shopping'}/${start}`;
const shopDoc = (mode,start) => state.docs[shopDocPath(mode,start)] || {};
const cleanAmount = n => Number.isFinite(+n) && +n>=0 ? +n : 0;
function openingStock(iid,mode,start) { return cleanAmount((shopDoc('week',start).stock || {})[iid]); }
function purchaseAmounts(need,stock,packSize,piece=0) {
  need=cleanAmount(need);stock=cleanAmount(stock);packSize=cleanAmount(packSize);
  const deficit=Math.max(0,need-stock);
  const packages=packSize>0?Math.max(0,Math.ceil(deficit/packSize-1e-9)):null;
  const buy=packages!==null?packages*packSize:piece>0?Math.ceil(deficit/piece-1e-9)*piece:deficit;
  return {need,stock,deficit,packSize,packages,buy,leftover:Math.max(0,stock+buy-need)};
}
let procurementTotals = null;
function procurementWeekTotal(ws) {
  if(!procurementTotals)return weekShopping(ws);
  if(!procurementTotals.has(ws))procurementTotals.set(ws,weekShopping(ws));
  return procurementTotals.get(ws);
}
function shoppingRow(iid,start,mode='week') {
  const policy=shoppingPolicy(iid), weeks=mode==='month'?shoppingWeeks(start):[start];
  const weekly=weeks.map(ws=>({week:ws,need:procurementWeekTotal(ws)[iid] || 0}));
  const stock=openingStock(iid,mode,start), need=weekly.reduce((n,w)=>n+w.need,0);
  let result=purchaseAmounts(need,stock,policy.packSize,ING[iid].unit==='kom'?ING[iid].piece:0);
  if(mode==='month' && policy.weeklyPacks && policy.packSize>0) {
    let available=stock,packages=0;
    for(const w of weekly) {const use=Math.min(available,w.need);available-=use;packages+=purchaseAmounts(w.need,use,policy.packSize).packages;}
    result={...result,packages,buy:packages*policy.packSize,leftover:stock+packages*policy.packSize-need};
  }
  return {iid,start,mode,policy,weekly,...result};
}
function shoppingRows(start,mode='week',storage=null) {
  const previous=procurementTotals;if(!previous)procurementTotals=new Map();
  try {
    const ids=new Set();(mode==='month'?shoppingWeeks(start):[start]).forEach(ws=>Object.keys(procurementWeekTotal(ws)).forEach(id=>ids.add(id)));
    return [...ids].filter(iid=>ING[iid]&&(!storage||shoppingPolicy(iid).storage===storage)).map(iid=>shoppingRow(iid,start,mode)).sort((a,b)=>ING[a.iid].name.localeCompare(ING[b.iid].name,'hr'));
  } finally {procurementTotals=previous;}
}
function shoppingMarkMatches(row) {
  const mark=(shopDoc(row.mode,row.start).checked || {})[row.iid];
  if(!mark || !row.buy)return false;
  if(mark===true)return true; // retain pre-package shopping ticks
  return Math.abs(mark.need-row.need)<1e-6&&Math.abs(mark.buy-row.buy)<1e-6&&mark.packSize===row.packSize&&mark.stock===row.stock;
}
function shoppingQuantity(iid,value) {
  const ing=ING[iid];let n=cleanAmount(value),unit=ing.unit==='ml'?'ml':'g';
  if(ing.unit==='kom') {n/=ing.piece;unit='kom';}
  else if(n>=1000) {n/=1000;unit=unit==='ml'?'l':'kg';}
  return n.toLocaleString('hr-HR',{maximumFractionDigits:unit==='kg'||unit==='l'?3:1})+' '+unit;
}
function shoppingBuyLabel(row) {return row.packages===null?shoppingQuantity(row.iid,row.buy):`${row.packages} × ${shoppingQuantity(row.iid,row.packSize)}`;}
function ensureShoppingWatches() {
  watch('planner/latest');
  if(state.view!=='kupovina')return;
  const weeks=state.shopMode==='month'?shoppingWeeks(state.weekStart):[state.weekStart];
  weeks.forEach(ws=>{watch('plans/'+ws);watch('shopping/'+ws);});
  if(state.shopMode==='month')watch(shopDocPath('month',state.weekStart));
}
function procurementRowsForView() {
  if(state.shopMode!=='month')return shoppingRows(state.weekStart);
  return ['pantry','freezer'].flatMap(s=>shoppingRows(state.weekStart,'month',s));
}
function procurementRowHtml(row) {
  const {iid,mode,start,policy}=row, done=shoppingMarkMatches(row), enough=row.buy===0;
  if(state.hideBought && (done||enough))return '';
  return `<li class="purchase-row ${done?'purchased':''} ${enough?'stocked':''}" data-key="${mode}-${start}-${iid}">
    <label class="purchase-select"><input type="checkbox" class="purchase-checkbox" data-action="purchase-check" data-id="${iid}" data-mode="${mode}" data-start="${start}" aria-label="Kupljeno: ${esc(ING[iid].name)}" ${done||enough?'checked':''} ${enough?'disabled':''}>
    <span class="purchase-info"><b>${esc(ING[iid].name)}</b><span class="purchase-amount"><span>${enough?'Već imaš dovoljno':done?'Kupljeno':'Kupiti'}</span> <strong>${enough?'Na zalihi':shoppingBuyLabel(row)}</strong>${row.packages!==null&&!enough?`<small>ukupno ${shoppingQuantity(iid,row.buy)}</small>`:''}</span></span></label>
    <div class="purchase-details"><div class="purchase-math"><span>Potrebno <strong>${shoppingQuantity(iid,row.need)}</strong></span>${row.stock?`<span>Imam ${shoppingQuantity(iid,row.stock)}</span>`:''}<span>${policy.weeklyPacks&&mode==='month'?'Višak pakiranja':'Ostaje'} ${shoppingQuantity(iid,row.leftover)}</span></div>${policy.weeklyPacks&&mode==='month'?'<p class="purchase-note">Pakiranja po tjednima · otvoreni višak potroši prema deklaraciji.</p>':''}
    <button class="text-btn purchase-edit" data-action="purchase-edit" data-id="${iid}" data-mode="${mode}" data-start="${start}">Pakiranje i zaliha</button></div></li>`;
}
function procurementSection(title,description,rows,key) {
  const html=rows.map(procurementRowHtml).join('');
  if(!rows.length)return '';
  return `<section class="card procurement-group" data-key="${key}"><div class="sect-h"><div><h3>${title}</h3><p class="small muted">${description}</p></div><span class="chip tag">${rows.filter(r=>r.buy>0&&!shoppingMarkMatches(r)).length} još za kupiti</span></div><ul class="purchase-list">${html||'<li class="small muted">Sve stavke ove grupe su kupljene ili na zalihi.</li>'}</ul></section>`;
}
function viewProcurement() {
  const start=state.weekStart,monthly=state.shopMode==='month',weeks=monthly?shoppingWeeks(start):[start];
  const filled=weeks.reduce((n,ws)=>n+weekFilled(ws),0),expected=weeks.length*21;
  const rows=procurementRowsForView(),needed=rows.filter(r=>r.buy>0),done=needed.filter(shoppingMarkMatches).length;
  const nav=`<div class="weeknav"><button class="icon-btn" data-action="purchase-period" data-d="-1" aria-label="Prethodno razdoblje">${ic('left')}</button><div class="mid"><b>${monthly?shoppingRange(start):weekLabel(start)}</b><small>${filled}/${expected} planiranih obroka</small></div><button class="icon-btn" data-action="purchase-period" data-d="1" aria-label="Sljedeće razdoblje">${ic('right')}</button></div>`;
  let lists='';
  if(monthly) {
    lists=procurementSection('Za ostavu','Trajne namirnice. Riža, žitarice i slične zalihe zaokružuju se jednom za sva četiri tjedna.',shoppingRows(start,'month','pantry'),'pantry')+
      procurementSection('Za zamrzivač','Podijeli po obrocima i tjednima; provjeri prostor u zamrzivaču.',shoppingRows(start,'month','freezer'),'freezer');
    lists+=`<section class="stack fresh-weeks"><div class="sect-h"><div><span class="eyebrow">Dopuna kroz mjesec</span><h2>Svježe kupuj svaki tjedan.</h2><p class="small muted">Mliječno, jaja i svježe povrće. Pakiranja se računaju za svaki tjedan zasebno; višak se ne prenosi automatski.</p></div></div>${weeks.map((ws,i)=>`<details class="card fresh-week" ${i===0?'open':''}><summary><span><b>${i+1}. tjedan</b> · ${weekLabel(ws)}</span>${ic('down')}</summary><ul class="purchase-list">${shoppingRows(ws,'week','fresh').map(procurementRowHtml).join('')||'<li class="small muted">Nema stavki ili su sve kupljene.</li>'}</ul><button class="text-btn" data-action="purchase-week" data-ws="${ws}">Otvori cijelu tjednu kupovinu ${ic('right')}</button></details>`).join('')}</section>`;
  } else {
    const categories=['meso','mlijecno','povrce','voce','zitarice','orasasti','ostalo','suplementi'];
    lists=categories.map(c=>procurementSection(CATS[c],'',rows.filter(r=>ING[r.iid].cat===c),'category-'+c)).join('');
  }
  return `<section class="pagehead"><span class="eyebrow">Manje odlazaka u trgovinu</span><h1>Kupuj pametnije.</h1><p class="muted">Točne potrebe iz jelovnika, cijela pakiranja i jasan pregled viška.</p></section>
    <div class="recipe-tabs" role="group" aria-label="Razdoblje kupovine"><button data-action="purchase-mode" data-mode="week" aria-pressed="${!monthly}">Tjedna kupovina</button><button data-action="purchase-mode" data-mode="month" aria-pressed="${monthly}">Velika kupovina · 4 tjedna</button></div>${nav}
    ${filled<expected?`<section class="banner"><div><b>Popis još nije potpun</b><p class="small">Nedostaje ${expected-filled} obroka. Kupovina zbraja samo odabrana jela.</p></div><button class="btn soft" data-action="curated-preview">Pogledaj pripremljeni jelovnik</button></section>`:''}
    ${filled?`<section class="card purchase-overview"><div><span class="eyebrow">${monthly?'Velika kupnja · ostava i zamrzivač':'Za odabrani tjedan'}</span><h2>${done} / ${needed.length} stavki kupljeno</h2><p class="small muted">${monthly?'Svježa kupovina nalazi se ispod, podijeljena po tjednima.':'Ako si već obavio veliku kupnju, upiši dostupnu zalihu prije tjedne dopune.'} Začine provjeri zasebno ispod.</p></div><div class="actions"><button class="btn primary" data-action="copy-shop">${ic('copy')}Kopiraj popis</button><button class="btn outline" data-action="download-shop">Preuzmi popis</button><button class="btn outline" data-action="hide-bought" aria-pressed="${state.hideBought}">${state.hideBought?'Prikaži sve':'Sakrij kupljeno'}</button></div></section>${spiceCard(start,state.shopMode)}${lists}`:`<section class="card blank"><p>Odaberi jelovnik pa će se kupovina izračunati.</p><button class="btn primary" data-action="curated-preview">Pripremljeni jelovnik za 4 tjedna</button></section>`}
    ${filled?'':spiceCard(start,state.shopMode)}<section class="card procurement-help"><details><summary>Kako računamo pakiranja i zalihu ${ic('down')}</summary><div class="stack"><p>Primjer: 350 g riže tjedno → 1,4 kg kroz četiri tjedna → 2 pakiranja po 1 kg → ostaje 600 g. Ako već imaš 650 g, kupuješ samo još 1 kg.</p><p>Veličine pakiranja su promjenjivi primjeri. Zaliha vrijedi za početak odabranog razdoblja i ne oduzima se ponovno svakog tjedna. Kvačica „kupljeno” ne mijenja zalihu. „Ostaje” je procjena nakon planirane potrošnje; za iduće razdoblje upiši stvarnu preostalu zalihu.</p><p>Konzerve računamo po ocijeđenoj masi; jaja po komadima. Pakiranja koja nakon otvaranja kratko traju zaokružujemo po tjednima. Kod ulja (g) nemoj upisati ml s boce kao da su grami.</p><p>Popis uključuje doručak, ručak i večeru iz plana. Začini i bilje imaju zaseban popis prema jelovniku. Međuobroci nisu uključeni; dopuni ih prema navikama. Količine mesa i povrća su očišćene, žitarice suhe.</p><p>Za kasnije tjedne meso i ribu razdijeli u porcije, označi i zamrzni prije isteka roka. Odmrzavaj u hladnjaku. Ostava vrijedi za neotvorene proizvode; nakon otvaranja slijedi deklaraciju. Hladnjak ≤ 4 °C, zamrzivač ≤ −18 °C.</p><p><a href="https://www.foodsafety.gov/food-safety-charts/cold-food-storage-charts" target="_blank" rel="noopener noreferrer">Smjernice za čuvanje hrane ↗</a></p></div></details></section>`;
}
function shoppingItemModal(m,close) {
  const row=shoppingRow(m.iid,m.start,m.mode),unit=ING[m.iid].unit==='kom'?'kom':ING[m.iid].unit==='ml'?'ml':'g',factor=unit==='kom'?ING[m.iid].piece:1;
  return `<div class="sh"><div><span class="eyebrow">${m.mode==='month'?shoppingRange(m.start):weekLabel(m.start)}</span><h3>${esc(ING[m.iid].name)}</h3></div>${close}</div><form class="form" data-action="save-purchase-item" data-id="${m.iid}" data-mode="${m.mode}" data-start="${m.start}">
  <label class="full">Veličina jednog pakiranja (${unit})<input class="field" name="pack" type="number" inputmode="decimal" min="0" max="1000000" step="any" required value="${row.packSize/factor}"><small>0 = kupnja na vagu / bez fiksnog pakiranja</small></label>
  <label class="full">Već imam na početku razdoblja (${unit})<input class="field" name="stock" type="number" inputmode="decimal" min="0" max="1000000" step="any" required value="${row.stock/factor}"><small>Unesi samo raspoloživu i upotrebljivu zalihu za prikazano razdoblje.</small></label>
  <label class="full">Kako kupujem i čuvam<select class="field" name="storage">${Object.entries(STORAGE_LABELS).map(([k,v])=>`<option value="${k}" ${row.policy.storage===k?'selected':''}>${v}</option>`).join('')}</select></label>
  <label class="full">Za veliku kupnju<select class="field" name="weeklyPacks"><option value="no" ${!row.policy.weeklyPacks?'selected':''}>Zbroji pa zaokruži na pakiranja</option><option value="yes" ${row.policy.weeklyPacks?'selected':''}>Zaokruži po tjednu (kratko traje nakon otvaranja)</option></select></label>
  <p class="small muted full">${esc(row.policy.note)} Pakiranje i način čuvanja vrijede ubuduće; zaliha za prikazani početni datum. Promjena kupovine ne mijenja porcije recepta.</p><button class="btn primary full" type="submit">Spremi i izračunaj</button></form>`;
}
function saveShoppingItem(iid,mode,start,values) {
  if(!ING[iid]||!['week','month'].includes(mode)||!LOG_DATE.test(start))return false;
  const factor=ING[iid].unit==='kom'?ING[iid].piece:1,pack=Number(values.pack),stock=Number(values.stock);
  if(!Number.isFinite(pack)||!Number.isFinite(stock)||pack<0||stock<0||pack>1000000||stock>1000000||!STORAGE_LABELS[values.storage])return false;
  if(ING[iid].unit==='kom'&&(!Number.isInteger(pack)||!Number.isInteger(stock)))return false;
  const s=settings();s.shoppingPrefs=s.shoppingPrefs||{};s.shoppingPrefs.items=s.shoppingPrefs.items||{};
  s.shoppingPrefs.items[iid]={packSize:pack*factor,storage:values.storage,weeklyPacks:values.weeklyPacks==='yes'};
  state.docs['settings/main']=s;persist('settings/main',s);
  const path=shopDocPath('week',start),doc=clone(shopDoc('week',start));doc.stock=doc.stock||{};doc.stock[iid]=stock*factor;
  state.docs[path]=doc;persist(path,doc);return true;
}
function togglePurchase(iid,mode,start) {
  const row=shoppingRow(iid,start,mode);if(!row.buy)return;
  const path=shopDocPath(mode,start),doc=clone(shopDoc(mode,start));doc.checked=doc.checked||{};
  if(shoppingMarkMatches(row))delete doc.checked[iid];else doc.checked[iid]={need:row.need,buy:row.buy,stock:row.stock,packSize:row.packSize};
  saveDoc(path,doc);
}
function shoppingText(start=state.weekStart,mode=state.shopMode||'week') {
  const line=r=>`${shoppingMarkMatches(r)?'[x]':'[ ]'} ${ING[r.iid].name}: ${r.buy?shoppingBuyLabel(r):'već na zalihi'} | potrebno ${shoppingQuantity(r.iid,r.need)} | zaliha ${shoppingQuantity(r.iid,r.stock)} | višak ${shoppingQuantity(r.iid,r.leftover)}`;
  let parts=[`Za naš stol · ${mode==='month'?'velika kupovina '+shoppingRange(start):'tjedna kupovina '+weekLabel(start)}`];
  if(mode==='month') {
    for(const storage of ['pantry','freezer'])parts.push(STORAGE_LABELS[storage].toUpperCase()+'\n'+shoppingRows(start,mode,storage).map(line).join('\n'));
    for(const ws of shoppingWeeks(start))parts.push('SVJEŽE · '+weekLabel(ws)+'\n'+shoppingRows(ws,'week','fresh').map(line).join('\n'));
  } else parts.push(shoppingRows(start,'week').map(line).join('\n'));
  parts.push(spiceShoppingText(start,mode));
  parts.push('Pakiranja su promjenjivi primjeri. Konzerve: ocijeđena masa. Jaja: komadi. Višak nakon otvaranja čuvaj prema deklaraciji. Začini su navedeni zasebno kao prijedlog dopune. Međuobroci nisu uključeni. Kvačice ne ažuriraju zalihu.');
  return parts.join('\n\n');
}
function downloadShopping() {
  const blob=new Blob([shoppingText()],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`kupovina-${state.weekStart}-${state.shopMode||'week'}.txt`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function curatedBanner() {
  return `<section class="card menu-invite"><div><span class="eyebrow">Pripremljeno za vas · ${shoppingRange(CURATED_MENU.start)}</span><h3>Četiri tjedna raznolikih obroka.</h3><p class="small muted">Ramstek, biftek, kvinoja, heljda i tofu, uz ribu, perad i obiteljske favorite.</p></div><button class="btn primary" data-action="curated-preview">Pogledaj jelovnik</button></section>`;
}
async function openCuratedEditor() {
  const previous=await fetchDoc('planner/latest');
  const saved=await Promise.all(CURATED_MENU.weeks.map(w=>fetchDoc('plans/'+w.week)));
  const hasSavedMenu=CURATED_MENU.weeks.some(w=>previous?.plans?.[w.week]) || saved.some(w=>w?.prepared);
  const weeks=CURATED_MENU.weeks.map((w,i)=>clone(hasSavedMenu&&saved[i]?.days?.length===7?saved[i]:w));
  const index=Math.max(0,weeks.findIndex(w=>w.week===state.weekStart));
  state.curatedEditor={weeks,index,dirty:false};
  state.modal={type:'curated-menu',title:'Uredi jelovnik'};renderModal();
}
function changeCuratedWeek(index) {
  if(!state.curatedEditor||!Number.isInteger(index)||index<0||index>=4)return;
  state.curatedEditor.index=index;renderModal();
  document.querySelector('.menu-scroll')?.scrollTo({top:0});
}
function curatedMenuModal(close) {
  const editor=state.curatedEditor;if(!editor)return '';
  const {weeks,index,dirty}=editor,w=weeks[index];
  return `<header class="menu-editor-head"><div class="sh"><div><span class="eyebrow">${shoppingRange(CURATED_MENU.start)}</span><h3>Jelovnik po vašem ukusu.</h3></div>${close}</div><p>Dodirni obrok koji želiš zamijeniti.</p>
    <div class="menu-week-tabs" role="group" aria-label="Odaberi tjedan">${weeks.map((week,i)=>`<button data-action="curated-week" data-index="${i}" aria-pressed="${i===index}">${i+1}. tjedan</button>`).join('')}</div>
    <div class="menu-week-nav"><button class="icon-btn" data-action="curated-week" data-index="${index-1}" aria-label="Prethodni tjedan jelovnika" ${index===0?'disabled':''}>${ic('left')}</button><b aria-live="polite">${weekLabel(w.week)}</b><button class="icon-btn" data-action="curated-week" data-index="${index+1}" aria-label="Sljedeći tjedan jelovnika" ${index===3?'disabled':''}>${ic('right')}</button></div></header>
    <div class="menu-scroll"><div class="menu-days">${w.days.map((d,i)=>`<article class="menu-day" data-key="menu-${w.week}-${i}"><header><h4>${DAYS_LONG[i]}</h4><span>${fmtDate(isoDate(addDays(parseDate(w.week),i)))}</span></header><div class="menu-day-meals">${SLOTS.map(([slot,meal])=>{
      const r=RB[d[slot]];
      return `<button class="menu-meal" data-action="curated-pick" data-di="${i}" data-slot="${slot}" aria-label="Promijeni ${lc(MEALS[meal])}, ${DAYS_LONG[i]}: ${esc(r?.title||'Odaberi obrok')}"><span class="menu-meal-photo">${r?pic(r.id):ic('plus')}</span><span class="menu-meal-copy"><small>${MEALS[meal]}${r?' · '+r.time+' min':''}</small><b>${esc(r?.title||'Odaberi obrok')}</b><span class="menu-meal-change">Zamijeni ${ic('shuffle')}</span></span></button>`;
    }).join('')}</div></article>`).join('')}</div></div>
    <footer class="menu-editor-footer"><p>${dirty?'Imaš nespremljene izmjene.':'Prilagodi jela pa spremi odabrani tjedan ili sva četiri.'} Kupovina se ažurira nakon spremanja.</p><div><button class="btn primary" data-action="apply-curated" data-count="4">Spremi sva 4 tjedna</button><button class="btn outline" data-action="apply-curated" data-count="1">Spremi ${index+1}. tjedan</button></div></footer>`;
}
function curatedPickModal(m) {
  const editor=state.curatedEditor,w=editor.weeks[editor.index],meal=SLOTS.find(([s])=>s===m.slot)?.[1],q=searchText(state.rsearch);
  const selected=w.days[m.di][m.slot];
  const options=RECIPES.filter(r=>r.meal===meal&&(!q||searchText(r.title).includes(q)||searchText(PROT[r.protein]).includes(q)||r.batch.some(e=>searchText(ING[e[1]].name).includes(q))));
  return `<header class="menu-editor-head"><div class="sh"><button class="icon-btn" data-action="curated-back" aria-label="Natrag na jelovnik">${ic('left')}</button><div class="grow"><span class="eyebrow">${DAYS_LONG[m.di]} · ${fmtDate(isoDate(addDays(parseDate(w.week),m.di)))}</span><h3>Odaberi ${lc(MEALS[meal])}</h3></div></div><div class="search">${ic('search')}<input type="search" id="rsearch" placeholder="Traži jelo ili namirnicu…" value="${esc(state.rsearch||'')}" autocomplete="off" aria-label="Traži zamjenski obrok"></div></header>
    <div class="menu-scroll"><div class="menu-options">${options.map(r=>`<button class="menu-meal ${r.id===selected?'selected':''}" data-action="curated-select" data-id="${r.id}" aria-pressed="${r.id===selected}"><span class="menu-meal-photo">${pic(r.id)}</span><span class="menu-meal-copy"><small>${r.time} min · ${PROT[r.protein]}</small><b>${esc(r.title)}</b><span class="menu-meal-change">${r.id===selected?'Odabrano':w.days.some(d=>d[m.slot]===r.id)?'Već u ovom tjednu · odaberi':'Odaberi ovo jelo'} ${ic(r.id===selected?'check':'plus')}</span></span></button>`).join('')||'<p class="small muted">Nema jela za taj pojam. Pokušaj drugim nazivom.</p>'}</div></div>`;
}
function showCuratedEditor() {
  const from=state.modal;state.modal={type:'curated-menu',title:'Uredi jelovnik'};renderModal();
  if(from?.type==='curated-pick') {
    const button=document.querySelector(`.menu-meal[data-di="${from.di}"][data-slot="${from.slot}"]`);
    button?.scrollIntoView({block:'center'});button?.focus({preventScroll:true});
  }
}
function selectCuratedMeal(id) {
  const m=state.modal,editor=state.curatedEditor,r=RB[id];
  if(m?.type!=='curated-pick'||!editor||!r||r.meal!==SLOTS.find(([s])=>s===m.slot)?.[1])return false;
  const day=editor.weeks[editor.index].days[m.di];if(!day)return false;
  if(day[m.slot]!==id){day[m.slot]=id;editor.dirty=true;}
  return true;
}
async function applyCuratedMenu(count=4) {
  const editor=state.curatedEditor,candidates=editor?.weeks||CURATED_MENU.weeks,index=editor?.index||0;
  const chosen=count===1?[candidates[index]]:candidates,backup={saved:new Date().toISOString(),plans:{},shopping:{}};
  for(const w of chosen) {
    backup.plans[w.week]=clone(await fetchDoc('plans/'+w.week));
    backup.shopping[w.week]=clone(await fetchDoc('shopping/'+w.week));
  }
  const changed=chosen.filter(w=>!w.days.every((d,i)=>SLOTS.every(([slot])=>backup.plans[w.week]?.days?.[i]?.[slot]===d[slot])));
  if(changed.length) {
    for(const w of chosen.filter(w=>!changed.includes(w))) {delete backup.plans[w.week];delete backup.shopping[w.week];}
    state.docs['planner/latest']=backup;await persist('planner/latest',backup);
    for(const w of changed) {
      const previous=backup.plans[w.week],next=clone(w);next.prepared=true;
      next.days.forEach((d,i)=>{d.montaza=!!previous?.days?.[i]?.montaza;});
      state.docs['plans/'+w.week]=next;await persist('plans/'+w.week,next);
      const shopping=clone(backup.shopping[w.week]||{});shopping.checked={};state.docs['shopping/'+w.week]=shopping;await persist('shopping/'+w.week,shopping);
    }
  }
  state.weekStart=candidates[index].week;state.shopMode='week';LS.set('zns:shopMode','week');state.recipe=null;state.view='plan';state.modal=null;state.curatedEditor=null;location.hash='plan';render();toast(changed.length?'Jelovnik je spremljen. Kupovina je ažurirana.':'Ovaj jelovnik je već spremljen.');
}
async function restorePreparedMenu() {
  const backup=state.docs['planner/latest'];if(!backup?.plans)return;
  for(const [week,plan] of Object.entries(backup.plans)) {state.docs['plans/'+week]=plan;await persist('plans/'+week,plan);const shop=backup.shopping[week]||null;state.docs['shopping/'+week]=shop;await persist('shopping/'+week,shop);}
  state.docs['planner/latest']=null;await persist('planner/latest',null);render();toast('Prethodni jelovnik je vraćen.');
}
