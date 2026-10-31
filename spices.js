/* Recipe spice notes are not weighed ingredients. Pack sizes below are shopping suggestions. */
const SPICES = [
  {id:'papar',name:'Crni papar',match:'\\bpap(?:ar|ra|rom|ru)\\b',pack:'1 pakiranje · 40–50 g',use:'Svježe samelji uz steak, jaja, gljive i povrće.'},
  {id:'sol',name:'Sol',match:'\\bsol(?:i)?\\b',pack:'1 pakiranje · 500 g',use:'Dosoli po ukusu na tanjuru, kako je navedeno u vašim receptima.'},
  {id:'origano',name:'Origano, sušeni',match:'origan',pack:'1 vrećica / staklenka · 10–15 g',use:'Piletina, kvinoja, pizza i umaci od rajčice.'},
  {id:'dimljena',name:'Dimljena slatka paprika',match:'dimljen[a-z]*(?: slatk[a-z]*)? paprik[a-z]*',pack:'1 pakiranje · 30–50 g',use:'Tofu, pureći burgeri, slanutak i pečeni krumpir. Biraj slatku ako ne želiš ljuto.'},
  {id:'slatka',name:'Slatka mljevena paprika',match:'slatk[a-z]*(?: mljeven[a-z]*)? paprik',pack:'1 pakiranje · 50–100 g',use:'Paprikaš, gulaš i punjene paprike. Umiješaj uz smanjenu vatru i dodaj tekućinu da ne zagori.'},
  {id:'kumin',name:'Kumin, mljeveni',match:'kumin',pack:'1 pakiranje · 20–30 g',use:'Shakshuka, slanutak, leća i tofu. Kumin i kim nisu isti začin.'},
  {id:'kurkuma',name:'Kurkuma',match:'kurkum',pack:'1 pakiranje · 20–30 g',use:'Za tofu kajganu kreni s ¼ žličice, kao u receptu.'},
  {id:'djumbir',name:'Đumbir, mljeveni',match:'d(?:j)?umbir',pack:'1 pakiranje · 20–30 g',use:'Za tofu s kikirikijem i biftek s brokulom: po ½ žličice za osnovnu količinu iz recepta.'},
  {id:'ruzmarin',name:'Ružmarin, sušeni',match:'ruzmarin',pack:'1 pakiranje · 10–20 g',use:'Ramstek, juneća plećka i pečeni krumpir. Počni s malo jer je aromatičan.'},
  {id:'timijan',name:'Timijan, sušeni',match:'timijan',pack:'1 pakiranje · 10–15 g',use:'Biftek s gljivama, kremasta heljda i pirjana junetina.'},
  {id:'lovor',name:'Lovorov list',match:'lovor',pack:'1 vrećica · 5–10 g',use:'Variva, gulaš i riba. List izvadi prije posluživanja.'},
  {id:'mazuran',name:'Mažuran',match:'mazuran',pack:'1 pakiranje · 10–15 g',use:'Juneći paprikaš i gulaš s heljdom.'},
  {id:'muskat',name:'Muškatni oraščić',match:'muskat',pack:'1 malo pakiranje · 10–15 g',use:'Prstohvat za pire, špinat, musaku i umak sa sirom.'},
  {id:'cimet',name:'Cimet, mljeveni',match:'cimet',pack:'1 pakiranje · 30–40 g',use:'Zobena kaša, palačinke, jogurt i kruška; malo i u musaku.'},
  {id:'cesnjak_prah',name:'Češnjak u prahu / granulama',match:'cesnjak[a-z]* u prahu',pack:'1 pakiranje · 40–50 g',use:'Pizza, pečeno povrće i suhe mješavine. Svježi češnjak već je na redovnom popisu.'},
  {id:'persin',name:'Peršin',match:'persin',fresh:true,pack:'1 vezica ili malo pakiranje smrznutog',use:'Dodaj pri kraju u ribu, salate, heljdu i variva.'},
  {id:'kopar',name:'Kopar',match:'kopar|kopr',fresh:true,pack:'1 malo pakiranje svježeg ili smrznutog',use:'Losos, jogurt-umak, krastavac i heljda s fetom.'},
  {id:'bosiljak',name:'Bosiljak',match:'bosilj',fresh:true,pack:'1 vezica / teglica ili smrznuti',use:'Rajčica, pizza, tjestenina i tagliata. Dodaj pred posluživanje.'},
  {id:'menta',name:'Menta / metvica',match:'\\bment(?:a|e|u|om)\\b|metvic',fresh:true,pack:'1 vezica ili malo pakiranje smrznute',use:'Grčka salata s kvinojom, bulgur i jogurtni preljevi.'},
  {id:'vlasac',name:'Vlasac',match:'vlas(?:ac|c[a-z]*)',fresh:true,pack:'1 vezica ili malo pakiranje smrznutog',use:'Jaja, svježi sir, krumpir i jogurtni umaci.'},
  {id:'cili',name:'Čili pahuljice',match:'cili',optional:true,pack:'1 malo pakiranje · 20–30 g',use:'Za ljutinu u tjestenini, tofuu i varivima; dodaj na tanjur po želji.'},
  {id:'vanilija',name:'Vanilija',match:'vanilij',optional:true,pack:'1 malo pakiranje mljevene vanilije',use:'Kaša, jogurt i palačinke. Provjeri kupuješ li čistu vaniliju ili zaslađenu mješavinu.'},
  {id:'sumak',name:'Sumak',match:'sumak',optional:true,pack:'1 malo pakiranje · 30–50 g',use:'Kiselkasti dodatak luku, salatama i kvinoji; kreni s prstohvatom.'},
  {id:'korijandar',name:'Korijandar, mljeveni',optional:true,pack:'1 pakiranje · 20–30 g',use:'Za dodatnu aromu uz kumin u slanutku, tofuu i pečenom povrću.'},
  {id:'curry',name:'Blagi curry',optional:true,pack:'1 pakiranje · 30–50 g',use:'Za drugačiju verziju piletine, tofua ili leće. Sastav i ljutina ovise o mješavini.'},
  {id:'ocat',name:'Vinski ili jabučni ocat',optional:true,pack:'1 boca · 250 ml',use:'Nekoliko kapi u salatu ili gotovo varivo ako mu nedostaje svježine. Limun je već u popisu namirnica.'}
];
const SPICE_COMBINATIONS = [
  ['Ramstek i biftek','Papar + ružmarin ili timijan. Dobro posuši meso, zapeci i odmori prije rezanja; ne treba mnogo različitih začina.'],
  ['Tofu kajgana','Kurkuma + kumin + dimljena paprika. Kreni s količinama iz recepta, pa prilagodi okus.'],
  ['Kvinoja i slanutak','Origano + peršin + limun. Za toplu, začinjenu verziju probaj kumin i dimljenu papriku.'],
  ['Heljda i gljive','Timijan + papar + peršin. Gljive dobro zapeci, pa začini.'],
  ['Riba i jogurt-umak','Kopar ili peršin + papar + limunova korica.'],
  ['Kaša, jogurt i voće','Cimet + malo vanilije.']
];
function spiceNeeds(start,mode='week') {
  const needs={};
  for(const ws of mode==='month'?shoppingWeeks(start):[start])for(const day of getPlan(ws).days)for(const [slot] of SLOTS) {
    const r=RB[day[slot]];if(!r)continue;
    const notes=searchText(r.spices||'');
    for(const s of SPICES)if(s.match&&new RegExp(s.match).test(s.id==='slatka'?notes.replace(/dimljen[a-z]*(?: slatk[a-z]*)? paprik[a-z]*/g,''):notes)) {
      needs[s.id]??={count:0,recipes:[]};needs[s.id].count++;if(!needs[s.id].recipes.includes(r.id))needs[s.id].recipes.push(r.id);
    }
  }
  return needs;
}
function spiceOwned(s,week) {return s.fresh?!!state.docs['shopping/'+week]?.herbs?.[s.id]:!!settings().spicePantry?.[s.id];}
function setSpiceOwned(id,week,owned) {
  const s=SPICES.find(s=>s.id===id);if(!s)return;
  if(s.fresh) {
    if(!LOG_DATE.test(week||''))return;
    const path='shopping/'+week,doc=clone(state.docs[path]||{});doc.herbs={...doc.herbs,[id]:!!owned};saveDoc(path,doc);
  } else {const prefs=settings();prefs.spicePantry={...prefs.spicePantry,[id]:!!owned};saveDoc('settings/main',prefs);}
}
function spiceRow(s,need,week) {
  const owned=spiceOwned(s,week);
  return `<li class="spice-row" data-key="spice-${week||'pantry'}-${s.id}"><label class="purchase-select"><input class="purchase-checkbox" type="checkbox" data-action="spice-owned" data-id="${s.id}" data-week="${week||''}" aria-label="Imam: ${esc(s.name)}${s.fresh?' · '+weekLabel(week):''}" ${owned?'checked':''}><span class="purchase-info"><b>${esc(s.name)}</b><span class="spice-pack">${owned?'Imam dovoljno':esc(s.pack)}</span></span></label><div class="purchase-details"><p>${esc(s.use)}</p>${need?`<small class="muted">Broj obroka u planu: ${need.count}</small>`:''}</div></li>`;
}
function spiceCard(start,mode) {
  const needs=spiceNeeds(start,mode),required=SPICES.filter(s=>needs[s.id]&&!s.optional),dry=required.filter(s=>!s.fresh);
  const missing=dry.filter(s=>!spiceOwned(s,start)).length;
  return `<section class="card spice-invite"><div><span class="eyebrow">Mala ostava, više okusa</span><h3>Začini i začinsko bilje</h3><p>${required.length?`${required.length} vrsta za ovaj jelovnik · ${missing} suhih začina za provjeriti.`:'Složi plan za točan popis, a dodatke za bolji okus pogledaj odmah.'}</p></div><button class="btn soft" data-action="open-spices" data-start="${start}" data-mode="${mode}">Otvori popis začina ${ic('right')}</button></section>`;
}
function spiceModal(m,close) {
  const needs=spiceNeeds(m.start,m.mode),required=SPICES.filter(s=>needs[s.id]&&!s.optional&&!s.fresh),weeks=m.mode==='month'?shoppingWeeks(m.start):[m.start];
  const optional=SPICES.filter(s=>!s.fresh&&(s.optional||!needs[s.id]));
  const section=(title,rows)=>`<section class="spice-group"><h4>${title}</h4><ul class="purchase-list">${rows.join('')||'<li class="small muted">Nema stavki za dopunu.</li>'}</ul></section>`;
  let content='';
  if(m.tab==='ideas')content=`<div class="spice-pairings">${SPICE_COMBINATIONS.map(([name,note])=>`<article><h4>${name}</h4><p>${note}</p></article>`).join('')}</div><p class="small muted spice-source">Inspiracija: <a href="https://www.udel.edu/academics/colleges/canr/cooperative-extension/fact-sheets/herbs-spices-on-food/" target="_blank" rel="noopener noreferrer">kombinacije bilja i hrane ↗</a> · <a href="https://www.bbcgoodfoodme.com/recipes/tofu-scramble-0/" target="_blank" rel="noopener noreferrer">začini za tofu ↗</a></p>`;
  else if(m.tab==='extra')content=`<p class="spice-explainer">Dodaci po želji i korisne zalihe koje odabrani plan ne traži. Ne moraš kupiti sve.</p>${section('Dobro je imati',optional.map(s=>spiceRow(s,needs[s.id],m.start)))}`;
  else {
    content=`<p class="spice-explainer">Kupuj samo ono čega nemaš dovoljno. Pakiranja su prijedlog za dopunu ostave, a ne izračun potrošnje začina.</p>${section('Suhi začini · za ostavu',required.map(s=>spiceRow(s,needs[s.id],m.start)))}`;
    content+=`<div class="spice-fresh"><h4>Svježe ili smrznuto bilje</h4><p class="small muted">Svježe dopuni svaki tjedan; smrznuto prema zalihi. Kvačice za bilje vrijede samo za navedeni tjedan.</p>${weeks.map(ws=>{const n=spiceNeeds(ws),herbs=SPICES.filter(s=>s.fresh&&n[s.id]);return herbs.length?`<details class="spice-herb-week" ${weeks.length===1?'open':''}><summary>${weekLabel(ws)} ${ic('down')}</summary><ul class="purchase-list">${herbs.map(s=>spiceRow(s,n[s.id],ws)).join('')||'<li class="small muted">Sve je na zalihi.</li>'}</ul></details>`:''}).join('')||'<p class="small muted">Nema bilja u odabranim jelima.</p>'}</div>`;
  }
  return `<header class="menu-editor-head"><div class="sh"><div><span class="eyebrow">${m.mode==='month'?shoppingRange(m.start):weekLabel(m.start)}</span><h3>Začini za vaš stol.</h3></div>${close}</div><p>Označi „Imam” kad imaš dovoljno. Odznači kad potrošiš.</p><div class="spice-tabs" role="group" aria-label="Prikaz začina">${[['needed','Za jelovnik'],['extra','Dobro je imati'],['ideas','Kombinacije']].map(([key,label])=>`<button data-action="spice-tab" data-tab="${key}" aria-pressed="${(m.tab||'needed')===key}">${label}</button>`).join('')}</div></header><div class="menu-scroll spice-scroll">${content}</div><footer class="menu-editor-footer"><p>Češnjak, limun, senf i sojin umak već su među namirnicama kada ih recept traži. Suhe začine čuvaj zatvorene, na suhom i dalje od topline.</p><button class="btn primary" data-action="copy-spices">${ic('copy')}Kopiraj popis začina</button></footer>`;
}
function spiceShoppingText(start,mode='week') {
  const needs=spiceNeeds(start,mode),parts=['ZAČINI · '+(mode==='month'?shoppingRange(start):weekLabel(start))];
  const line=(s,week)=>`${spiceOwned(s,week)?'[x] Imam':'[ ] Dopuniti'} ${s.name} — ${s.pack}`;
  parts.push('ZA JELOVNIK · SUHI ZAČINI\n'+SPICES.filter(s=>needs[s.id]&&!s.optional&&!s.fresh).map(s=>line(s,start)).join('\n'));
  for(const ws of mode==='month'?shoppingWeeks(start):[start]) {
    const n=spiceNeeds(ws),herbs=SPICES.filter(s=>s.fresh&&n[s.id]);
    if(herbs.length)parts.push('SVJEŽE / SMRZNUTO BILJE · '+weekLabel(ws)+'\n'+herbs.map(s=>line(s,ws)).join('\n'));
  }
  parts.push('PO ŽELJI · NIJE OBAVEZNA KUPOVINA\n'+SPICES.filter(s=>!s.fresh&&(s.optional||!needs[s.id])).map(s=>line(s,start)).join('\n'));
  parts.push('Pakiranja začina su prijedlozi dopune, ne izračun potrošnje. Ako već imaš dovoljno, ne kupuj ponovno. Kvačice suhih začina ostaju spremljene; bilje se provjerava po tjednima.');
  return parts.join('\n\n');
}
