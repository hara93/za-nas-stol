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
    <button class="purchase-check" data-action="purchase-check" data-id="${iid}" data-mode="${mode}" data-start="${start}" aria-pressed="${done}" aria-label="${done?'Označi kao nekupljeno':'Označi kupljeno'}: ${esc(ING[iid].name)}" ${enough?'disabled':''}><span class="check sm ${done||enough?'on':''}">${ic('check','')}</span></button>
    <div class="purchase-info"><b>${esc(ING[iid].name)}</b><div class="purchase-math"><span>Potrebno <strong>${shoppingQuantity(iid,row.need)}</strong></span>${row.stock?`<span>Imam ${shoppingQuantity(iid,row.stock)}</span>`:''}<span>${policy.weeklyPacks&&mode==='month'?'Višak pakiranja':'Ostaje'} ${shoppingQuantity(iid,row.leftover)}</span></div>${policy.weeklyPacks&&mode==='month'?'<small class="muted">Pakiranja po tjednima · otvoreni višak potroši prema deklaraciji.</small>':''}
    <button class="text-btn purchase-edit" data-action="purchase-edit" data-id="${iid}" data-mode="${mode}" data-start="${start}">Pakiranje i zaliha</button></div>
    <div class="purchase-amount"><small>${enough?'Već imaš dovoljno':done?'Kupljeno':'Kupiti'}</small><strong>${enough?'—':shoppingBuyLabel(row)}</strong>${row.packages!==null&&!enough?`<small>ukupno ${shoppingQuantity(iid,row.buy)}</small>`:policy.packSize===0&&!enough?'<small>na vagu / prilagodi pakiranje</small>':''}</div></li>`;
}
function procurementSection(title,description,rows,key) {
  const html=rows.map(procurementRowHtml).join('');
  if(!rows.length)return '';
  return `<section class="card procurement-group" data-key="${key}"><div class="sect-h"><div><h3>${title}</h3><p class="small muted">${description}</p></div><span class="chip tag">${rows.filter(r=>r.buy>0).length} za kupiti</span></div><ul class="purchase-list">${html||'<li class="small muted">Sve stavke ove grupe su kupljene ili na zalihi.</li>'}</ul></section>`;
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
    ${filled?`<section class="card purchase-overview"><div><span class="eyebrow">${monthly?'Velika kupnja · ostava i zamrzivač':'Za odabrani tjedan'}</span><h2>${done} / ${needed.length} stavki kupljeno</h2><p class="small muted">${monthly?'Svježa kupovina nalazi se ispod, podijeljena po tjednima.':'Ako si već obavio veliku kupnju, upiši dostupnu zalihu prije tjedne dopune.'}</p></div><div class="actions"><button class="btn primary" data-action="copy-shop">${ic('copy')}Kopiraj popis</button><button class="btn outline" data-action="download-shop">Preuzmi popis</button><button class="btn outline" data-action="hide-bought" aria-pressed="${state.hideBought}">${state.hideBought?'Prikaži sve':'Sakrij kupljeno'}</button></div></section>${lists}`:`<section class="card blank"><p>Odaberi jelovnik pa će se kupovina izračunati.</p><button class="btn primary" data-action="curated-preview">Pripremljeni jelovnik za 4 tjedna</button></section>`}
    <section class="card procurement-help"><details><summary>Kako računamo pakiranja i zalihu ${ic('down')}</summary><div class="stack"><p>Primjer: 350 g riže tjedno → 1,4 kg kroz četiri tjedna → 2 pakiranja po 1 kg → ostaje 600 g. Ako već imaš 650 g, kupuješ samo još 1 kg.</p><p>Veličine pakiranja su promjenjivi primjeri. Zaliha vrijedi za početak odabranog razdoblja i ne oduzima se ponovno svakog tjedna. Kvačica „kupljeno” ne mijenja zalihu. „Ostaje” je procjena nakon planirane potrošnje; za iduće razdoblje upiši stvarnu preostalu zalihu.</p><p>Konzerve računamo po ocijeđenoj masi; jaja po komadima. Pakiranja koja nakon otvaranja kratko traju zaokružujemo po tjednima. Kod ulja (g) nemoj upisati ml s boce kao da su grami.</p><p>Popis uključuje doručak, ručak i večeru iz plana. Međuobroci i začini po ukusu nisu uključeni; dopuni ih prema navikama. Količine mesa i povrća su očišćene, žitarice suhe.</p><p>Za kasnije tjedne meso i ribu razdijeli u porcije, označi i zamrzni prije isteka roka. Odmrzavaj u hladnjaku. Ostava vrijedi za neotvorene proizvode; nakon otvaranja slijedi deklaraciju. Hladnjak ≤ 4 °C, zamrzivač ≤ −18 °C.</p><p><a href="https://www.foodsafety.gov/food-safety-charts/cold-food-storage-charts" target="_blank" rel="noopener noreferrer">Smjernice za čuvanje hrane ↗</a></p></div></details></section>`;
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
  parts.push('Pakiranja su promjenjivi primjeri. Konzerve: ocijeđena masa. Jaja: komadi. Višak nakon otvaranja čuvaj prema deklaraciji. Međuobroci i začini po ukusu nisu uključeni. Kvačice ne ažuriraju zalihu.');
  return parts.join('\n\n');
}
function downloadShopping() {
  const blob=new Blob([shoppingText()],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`kupovina-${state.weekStart}-${state.shopMode||'week'}.txt`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function curatedBanner() {
  return `<section class="card menu-invite"><div><span class="eyebrow">Pripremljeno za vas · ${shoppingRange(CURATED_MENU.start)}</span><h3>Četiri tjedna raznolikih obroka.</h3><p class="small muted">Ramstek, biftek, kvinoja, heljda i tofu, uz ribu, perad i obiteljske favorite.</p></div><button class="btn primary" data-action="curated-preview">Pogledaj jelovnik</button></section>`;
}
function curatedMenuModal(close) {
  return `<div class="sh"><div><span class="eyebrow">${shoppingRange(CURATED_MENU.start)} · 84 obroka</span><h3>Vaš pripremljeni jelovnik</h3></div>${close}</div><p class="small muted">Svaki tjedan ima 21 različit recept. Postavljanje mijenja obroke samo za ove datume i sprema prethodni plan za povrat.</p><div class="curated-weeks">${CURATED_MENU.weeks.map((w,wi)=>`<details ${wi===0?'open':''}><summary><b>${wi+1}. tjedan · ${weekLabel(w.week)}</b>${ic('down')}</summary><div class="menu-table-wrap"><table class="tbl menu-table"><thead><tr><th>Dan</th><th>Doručak</th><th>Ručak</th><th>Večera</th></tr></thead><tbody>${w.days.map((d,i)=>`<tr><th>${DAYS_LONG[i]}</th>${SLOTS.map(([slot])=>`<td>${esc(RB[d[slot]].title)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>`).join('')}</div><div class="actions"><button class="btn primary" data-action="apply-curated" data-count="4">Postavi sva 4 tjedna</button><button class="btn outline" data-action="apply-curated" data-count="1">Samo prvi tjedan</button></div>`;
}
async function applyCuratedMenu(count=4) {
  const chosen=CURATED_MENU.weeks.slice(0,count===1?1:4),backup={saved:new Date().toISOString(),plans:{},shopping:{}};
  for(const w of chosen) {
    backup.plans[w.week]=clone(await fetchDoc('plans/'+w.week));
    backup.shopping[w.week]=clone(await fetchDoc('shopping/'+w.week));
  }
  const alreadySet=chosen.every(w=>w.days.every((d,i)=>SLOTS.every(([slot])=>backup.plans[w.week]?.days?.[i]?.[slot]===d[slot])));
  if(alreadySet) {
    state.weekStart=CURATED_MENU.start;state.view='plan';state.modal=null;location.hash='plan';render();toast('Ovaj jelovnik je već postavljen.');return;
  }
  state.docs['planner/latest']=backup;await persist('planner/latest',backup);
  for(const w of chosen) {
    const previous=backup.plans[w.week];const next=clone(w);
    next.days.forEach((d,i)=>{d.montaza=!!previous?.days?.[i]?.montaza;});
    state.docs['plans/'+w.week]=next;await persist('plans/'+w.week,next);
    const shopping=clone(backup.shopping[w.week]||{});shopping.checked={};state.docs['shopping/'+w.week]=shopping;await persist('shopping/'+w.week,shopping);
  }
  state.weekStart=CURATED_MENU.start;state.shopMode='week';state.recipe=null;state.view='plan';state.modal=null;location.hash='plan';render();toast('Jelovnik je postavljen. Prethodni plan možeš vratiti.');
}
async function restorePreparedMenu() {
  const backup=state.docs['planner/latest'];if(!backup?.plans)return;
  for(const [week,plan] of Object.entries(backup.plans)) {state.docs['plans/'+week]=plan;await persist('plans/'+week,plan);const shop=backup.shopping[week]||null;state.docs['shopping/'+week]=shop;await persist('shopping/'+week,shop);}
  state.docs['planner/latest']=null;await persist('planner/latest',null);render();toast('Prethodni jelovnik je vraćen.');
}
