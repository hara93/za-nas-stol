const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const base = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(base, 'index.html'), 'utf8');
const script = [...html.matchAll(/<script(?: src="([^"]+)")?>([\s\S]*?)<\/script>/g)].slice(1).map(m => m[1] ? fs.readFileSync(path.join(base,m[1].split('?')[0]),'utf8') : m[2]).join('\n').replace(/\nboot\(\);\s*$/, '\n');
function app() {
  const storage = new Map();
  const events = {};
  const context = vm.createContext({
    console, setTimeout, clearTimeout, setInterval, clearInterval, URL, testEvents: events,
    document: { addEventListener(type, fn) { (events[type] ||= []).push(fn); }, querySelector() { return null; } }, window: { addEventListener() {} },
    navigator: {}, location: { hash: '', hostname: 'test', protocol: 'http:' },
    localStorage: { getItem:k=>storage.get(k)??null, setItem:(k,v)=>storage.set(k,v), removeItem:k=>storage.delete(k), key:i=>[...storage.keys()][i], get length(){return storage.size;} }
  });
  vm.runInContext(script, context);
  vm.runInContext('render = () => {}; toast = () => {};', context);
  return expression => vm.runInContext(expression, context);
}
test('all recipes resolve ingredients, portions and photo assets', () => {
  const run = app();
  const recipes = run('RECIPES');
  assert.equal(recipes.length, 42);
  assert.equal(new Set(recipes.map(r=>r.id)).size, recipes.length);
  for (const r of recipes) {
    for (const e of r.batch) {
      assert.ok(run(`ING[${JSON.stringify(e[1])}]`), `${r.id}: ${e[1]}`);
      assert.ok(r.groups[e[0]] && e[2] > 0 && e[3] === 1);
    }
    const whole = run(`wholeOf(RB['${r.id}'])`);
    for (const [iid,g] of Object.entries(whole)) {
      const allocated = run(`PEOPLE.reduce((n,p) => n+(gramsFor(RB['${r.id}'],p)['${iid}']||0),0)`);
      assert.ok(Math.abs(g-allocated)<1e-8, `${r.id}: ${iid} whole vs portions`);
    }
    for (const p of ['T','S','K']) {
      const n=run(`rnut(RB['${r.id}'],'${p}')`);
      assert.ok(n.kcal>0 && n.p>0 && Object.values(n).every(Number.isFinite));
    }
  }
  const photos=run('IMAGES');
  for(const {id} of [...recipes,...run('SNACKS')]) assert.ok(photos[id], `Missing photo mapping ${id}`);
  for (const [id,file] of Object.entries(photos)) assert.ok(fs.existsSync(path.join(base,file)), `Missing photo ${id}`);
});
test('new recipes expose source, tags and dry-weight nutrition', () => {
  const run=app();
  assert.equal(run('ING.kvinoja.n.kcal'),368);
  assert.equal(run('ING.heljda.n.kcal'),343);
  assert.equal(run('ING.tofu.n.kcal'),144);
  assert.equal(run('ING.tofu.n.dha'),null);
  for(const id of ['R11','R12','R13','V11','V12','V13']) {
    const r=run(`RB['${id}']`);
    assert.match(r.source.url,/^https:\/\//);
    assert.ok(r.source.note && r.nutritionNote);
    const detail=run(`viewRecipeDetail(RB['${id}'])`);
    assert.ok(detail.includes(r.source.url) && detail.includes('Izvor recepta'));
    for(const ingredient of ['kvinoja','heljda','tofu']) if(r.batch.some(e=>e[1]===ingredient))assert.ok(r.tags.includes(ingredient));
  }
});
test('search supports Croatian without accents, all meals and ingredient filters', () => {
  const run=app();
  run("state.rq='spinat'");
  assert.ok(run("recipeMatches(RB.D04)"));
  run("state.rq='';state.rtags.add('tofu')");
  assert.equal(run('RECIPES.filter(recipeMatches).length'),2);
  assert.ok(run('viewRecipes()').includes('Zlatni tofu'));
  run("state.rq='nothing';state.rmeal='rucak';state.favoritesOnly=true;ACTIONS['clear-filters']()");
  assert.equal(run('RECIPES.filter(recipeMatches).length'),42);
  assert.equal(run('state.rmeal'),'all');
});
test('favorites persist in existing settings and survive export/import', () => {
  const run=app();
  run("state.docs['settings/main']={names:{T:'Test'},split:{T:50,S:35,K:15}};ACTIONS.favorite({dataset:{id:'V12'}})");
  assert.equal(run("LS.get('zns:settings/main').favorites[0]"),'V12');
  assert.equal(run("settings().names.T"),'Test');
  const exported=run('JSON.stringify(exportData())');
  run("closeModal=()=>{}; state.docs={}");
  run(`importData(${JSON.stringify(exported)})`);
  assert.ok(run("favorites().has('V12')"));
  assert.equal(run('settings().split.T'),50);
});
test('changing a planned recipe updates shopping and daily nutrients without touching other slots', () => {
  const run=app();
  run("state.weekStart='2026-10-26';state.date='2026-10-30';setSlot(state.weekStart,4,'b','D04');setSlot(state.weekStart,4,'l','R11')");
  assert.equal(run("weekShopping(state.weekStart).kvinoja"),160);
  run("setSlot(state.weekStart,4,'l','R13')");
  assert.equal(run("weekShopping(state.weekStart).kvinoja"),undefined);
  assert.equal(run("weekShopping(state.weekStart).heljda"),180);
  assert.equal(run("dayPlan(state.date).b"),'D04');
  const n=run("dayNut(state.date,'T',false).kcal");
  assert.ok(n>run("rnut(RB.R13,'T').kcal"));
  run("setEaten(state.date,'l',true)");
  assert.equal(run("dayNut(state.date,'T',true).kcal"),run("rnut(RB.R13,'T').kcal"));
});
test('week generator accepts expanded catalogue and preserves locked selections', () => {
  const run=app();
  run("state.weekStart='2026-11-02';const plan=emptyPlan(state.weekStart);plan.days[0].l='R11';plan.days[1].v='V12';state.docs['plans/'+state.weekStart]=buildWeek(plan,{},true)");
  assert.equal(run('weekFilled(state.weekStart)'),21);
  assert.equal(run('getPlan(state.weekStart).days[0].l'),'R11');
  assert.equal(run('getPlan(state.weekStart).days[1].v'),'V12');
  assert.equal(run('new Set(getPlan(state.weekStart).days.flatMap(d=>[d.b,d.l,d.v])).size'),21);
});
test('recipe deep links are reloadable and catalogue back clears detail', () => {
  const run=app();
  run("location.hash='#recepti/V12';applyHash()");
  assert.equal(run('state.recipe'),'V12');assert.equal(run('state.view'),'recepti');
  run("location.hash='#recepti';applyHash()");assert.equal(run('state.recipe'),null);
});
test('default photos never override a user photo and request failure has an illustration fallback', () => {
  const run=app();
  run("state.docs['images/all']={D04:'custom-photo'}");
  assert.equal(run("imgSrc('D04')"),'/_blob/custom-photo');
  assert.match(run("pic('D04')"),/data-recipe-image="D04"/);
  assert.match(run("pic('R11')"),/assets\/meals\/R11.webp/);
});

test('beef filters include existing mince and keep steak cuts separate in shopping', () => {
  const run=app();
  run("state.rtags.add('junetina')");
  assert.ok(run("recipeMatches(RECIPES.find(r=>r.batch.some(e=>e[1]==='junetina_mljevena')))"));
  assert.ok(!run("recipeMatches(RB.R11)"));
  for(const id of ['R14','R15','R16','V14','V15','V16']) {
    assert.ok(run(`recipeMatches(RB['${id}'])`));
    const r=run(`RB['${id}']`);
    assert.equal(r.protein,'crveno');
    assert.ok(r.source.url.startsWith('https://') && r.nutritionNote);
    const detail=run(`viewRecipeDetail(RB['${id}'])`);
    assert.ok(detail.includes(r.source.url) && detail.includes(r.buyingTip));
  }
  for(const id of ['R16','V16']) assert.ok(run(`RB['${id}'].steps.flatMap(stepTimers).some(t=>t.sec===7200)`), 'Slow braise exposes its cooking timer');
  run('state.batch=true');
  assert.ok(run('viewRecipeDetail(RB.R14)').includes('udvostruči i vodu'));
  run("state.rtags.clear();state.rtags.add('ramstek')");
  assert.equal(run('RECIPES.filter(recipeMatches).length'),2);
  run("state.rtags.clear();state.rtags.add('biftek')");
  assert.equal(run('RECIPES.filter(recipeMatches).length'),2);
  run("state.weekStart='2026-11-09';state.docs['plans/'+state.weekStart]=emptyPlan(state.weekStart);setSlot(state.weekStart,0,'l','R14');setSlot(state.weekStart,1,'l','R15');setSlot(state.weekStart,2,'l','R16')");
  for(const [id,cut] of [['R14','ramstek'],['R15','biftek'],['R16','juneca_plecka']]) {
    assert.equal(run(`weekShopping(state.weekStart)['${cut}']`),run(`wholeOf(RB['${id}'])['${cut}']`));
    assert.ok(run(`ING['${cut}'].src`).includes('USDA'));
  }
  run("setSlot(state.weekStart,1,'l','R14')");
  assert.equal(run('weekShopping(state.weekStart).biftek'),undefined);
  assert.equal(run('weekShopping(state.weekStart).ramstek'),run('wholeOf(RB.R14).ramstek*2'));
});

test('packages round the whole four-week need once and subtract opening stock once', () => {
  const run=app();
  for(const [need,stock,pack,buy,left] of [[350,0,1000,1000,650],[1400,0,1000,2000,600],[1400,650,1000,1000,250],[350,400,1000,0,50],[0,0,1000,0,0],[1000.00000001,0,1000,1000,0]]) {
    const result=run(`purchaseAmounts(${need},${stock},${pack})`);
    assert.equal(result.buy,buy);assert.ok(Math.abs(result.leftover-left)<1e-6);
  }
  assert.equal(run('purchaseAmounts(750,0,500,50).buy'),1000); // 15 eggs -> 2 x 10
  assert.equal(run('purchaseAmounts(125,0,0,50).buy'),150); // loose eggs remain whole
  assert.equal(run('purchaseAmounts(320,0,240).buy'),480); // edible drained can weight
});
test('prepared month includes requested ingredients, distinct weekly meals and all twelve additions', () => {
  const run=app(),menu=run('CURATED_MENU'),recipes=run('RB');
  assert.equal(menu.weeks.length,4);
  const ids=new Set();
  for(const week of menu.weeks) {
    assert.equal(week.days.length,7);
    assert.equal(new Set(week.days.flatMap(d=>[d.b,d.l,d.v])).size,21);
    for(const d of week.days)for(const [slot,meal] of [['b','dorucak'],['l','rucak'],['v','vecera']]) {assert.equal(recipes[d[slot]].meal,meal);ids.add(d[slot]);}
    assert.equal(week.days.flatMap(d=>[d.b,d.l,d.v]).filter(id=>recipes[id].protein==='crveno').length,2);
  }
  const firstIngredients=new Set(menu.weeks[0].days.flatMap(d=>[d.b,d.l,d.v]).flatMap(id=>recipes[id].batch.map(e=>e[1])));
  for(const iid of ['ramstek','biftek','kvinoja','heljda','tofu'])assert.ok(firstIngredients.has(iid));
  for(const id of ['R11','R12','R13','V11','V12','V13','R14','R15','R16','V14','V15','V16'])assert.ok(ids.has(id));
});
test('monthly procurement reads four actual plans, not four copies of the first', () => {
  const run=app();
  run("CURATED_MENU.weeks.forEach(w=>state.docs['plans/'+w.week]=w);state.weekStart=CURATED_MENU.start");
  const row=run("shoppingRow('riza_integralna',CURATED_MENU.start,'month')");
  assert.equal(row.need,160);assert.equal(row.buy,1000);
  assert.notEqual(row.need,run('weekShopping(CURATED_MENU.start).riza_integralna*4'));
  run("state.docs['shopping/'+CURATED_MENU.start]={stock:{riza_integralna:650}}");
  assert.equal(run("shoppingRow('riza_integralna',CURATED_MENU.start,'month').buy"),0);
  assert.equal(run("shoppingRow('riza_integralna',CURATED_MENU.start,'month').leftover"),490);
  assert.equal(run("openingStock('riza_integralna','month','2026-11-30')"),0);
});
test('short-lived opened packs round by week while dry grains aggregate across weeks', () => {
  const run=app();
  run("shoppingWeeks('2026-11-02').forEach(ws=>state.docs['plans/'+ws]=emptyPlan(ws));setSlot('2026-11-02',0,'l','R11');setSlot('2026-11-16',0,'l','R11')");
  const cans=run("shoppingRow('slanutak','2026-11-02','month')");
  assert.equal(cans.need,640);assert.equal(cans.packages,4);
  assert.equal(run("shoppingRow('kvinoja','2026-11-02','month').packages"),1);
  run("state.docs['settings/main']={shoppingPrefs:{items:{slanutak:{weeklyPacks:false}}}}");
  assert.equal(run("shoppingRow('slanutak','2026-11-02','month').packages"),3);
});
test('package and stock editing preserves settings, converts egg units and survives export/import', () => {
  const run=app();run("state.docs['settings/main']={names:{T:'Test'},favorites:['R14']}");
  assert.ok(run("saveShoppingItem('jaja','month','2026-11-02',{pack:10,stock:3,storage:'fresh',weeklyPacks:'yes'})"));
  assert.equal(run("shoppingPolicy('jaja').packSize"),500);
  assert.equal(run("openingStock('jaja','month','2026-11-02')"),150);
  assert.equal(run("openingStock('jaja','week','2026-11-02')"),150);
  assert.ok(!run("saveShoppingItem('jaja','week','2026-11-02',{pack:2.5,stock:0,storage:'fresh'})"));
  const exported=run('JSON.stringify(exportData())');run('closeModal=()=>{};state.docs={}');run(`importData(${JSON.stringify(exported)})`);
  assert.equal(run("settings().names.T"),'Test');assert.ok(run("favorites().has('R14')"));
  assert.equal(run("openingStock('jaja','week','2026-11-02')"),150);
});
test('purchase ticks do not add stock and become stale after quantity changes', () => {
  const run=app();run("state.docs['plans/2026-11-02']=emptyPlan('2026-11-02');setSlot('2026-11-02',0,'v','V15')");
  run("togglePurchase('riza_integralna','month','2026-11-02')");
  assert.ok(run("shoppingMarkMatches(shoppingRow('riza_integralna','2026-11-02','month'))"));
  assert.equal(run("openingStock('riza_integralna','month','2026-11-02')"),0);
  run("setSlot('2026-11-02',1,'v','V15')");
  assert.ok(!run("shoppingMarkMatches(shoppingRow('riza_integralna','2026-11-02','month'))"));
});
test('prepared plans can be applied, exported and restored without overwriting unrelated dates', async () => {
  const run=app();
  run("state.docs['plans/2026-11-02']=emptyPlan('2026-11-02');setSlot('2026-11-02',0,'l','R15');state.docs['plans/2026-12-07']=emptyPlan('2026-12-07');setSlot('2026-12-07',0,'l','R14');state.docs['shopping/2026-11-02']={checked:{jaja:true},stock:{jaja:100}};persist('shopping/2026-11-02',state.docs['shopping/2026-11-02'])");
  await run('applyCuratedMenu(4)');
  assert.equal(run("getPlan('2026-11-02').days[0].l"),'R11');assert.equal(run('weekFilled("2026-11-23")'),21);
  assert.equal(run("getPlan('2026-12-07').days[0].l"),'R14');
  assert.ok(run("exportData().docs['planner/latest']"));
  await run('applyCuratedMenu(4)');
  assert.equal(run("state.docs['planner/latest'].plans['2026-11-02'].days[0].l"),'R15');
  await run('restorePreparedMenu()');
  assert.equal(run("getPlan('2026-11-02').days[0].l"),'R15');
  assert.equal(run("state.docs['shopping/2026-11-02'].checked.jaja"),true);
  assert.equal(run("state.docs['shopping/2026-11-02'].stock.jaja"),100);
});
test('monthly screen and copied list separate bulk shopping from each fresh week', () => {
  const run=app();run("CURATED_MENU.weeks.forEach(w=>state.docs['plans/'+w.week]=w);state.weekStart=CURATED_MENU.start;state.shopMode='month'");
  const text=run('shoppingText()');assert.ok(text.includes('ZA OSTAVU')&&text.includes('ZA ZAMRZIVAČ'));
  assert.equal((text.match(/SVJEŽE · /g)||[]).length,4);
  const html=run('viewProcurement()');assert.ok(html.includes('84/84')&&html.includes('Svježe kupuj svaki tjedan.'));
  run("state.docs['plans/2026-11-23']=emptyPlan('2026-11-23')");
  assert.ok(run('viewProcurement()').includes('Nedostaje 21 obroka'));
});
test('menu editor changes stay in draft and saving the selected week updates only that week', async () => {
  const run=app();run('renderModal=()=>{}');await run('applyCuratedMenu(4)');
  run("state.weekStart='2026-11-02';togglePurchase('kvinoja','week','2026-11-02')");
  const before=run("JSON.stringify(getPlan('2026-11-02'))"),need=run("weekShopping('2026-11-09').kvinoja||0");
  await run('openCuratedEditor()');run("changeCuratedWeek(1);state.modal={type:'curated-pick',di:0,slot:'l'}");
  assert.equal(run("selectCuratedMeal('D01')"),false);
  assert.ok(run("selectCuratedMeal('R11')"));
  assert.equal(run("weekShopping('2026-11-09').kvinoja||0"),need);
  assert.equal(run("JSON.stringify(getPlan('2026-11-02'))"),before);
  await run('applyCuratedMenu(1)');
  assert.equal(run("getPlan('2026-11-09').days[0].l"),'R11');
  assert.equal(run("JSON.stringify(getPlan('2026-11-02'))"),before);
  assert.ok(run("shoppingMarkMatches(shoppingRow('kvinoja','2026-11-02'))"));
  assert.equal(run('state.weekStart'),'2026-11-09');
  await run('openCuratedEditor()');assert.equal(run('state.curatedEditor.weeks[1].days[0].l'),'R11');
  assert.ok(run('curatedMenuModal("")').includes('Spremi 2. tjedan'));
  assert.ok(!run('curatedMenuModal("")').includes('<table'));
  await run('restorePreparedMenu()');assert.equal(run("weekShopping('2026-11-09').kvinoja||0"),need);
});
test('saving all four weeks retains replacements and reopening includes existing manual plan edits', async () => {
  const run=app();run('renderModal=()=>{}');await run('applyCuratedMenu(4)');
  run("setSlot('2026-11-16',3,'v','V15')");await run('openCuratedEditor()');
  assert.equal(run('state.curatedEditor.weeks[2].days[3].v'),'V15');
  run("changeCuratedWeek(3);state.modal={type:'curated-pick',di:6,slot:'v'};selectCuratedMeal('V12')");
  await run('applyCuratedMenu(4)');
  assert.equal(run("getPlan('2026-11-23').days[6].v"),'V12');
  assert.equal(run("getPlan('2026-11-16').days[3].v"),'V15');
  assert.ok(run("weekShopping('2026-11-23').tofu")>0);
});
test('shopping uses labelled checkboxes and remaining group counts exclude purchased rows', () => {
  const run=app();run("state.docs['plans/2026-11-02']=emptyPlan('2026-11-02');setSlot('2026-11-02',0,'l','R11')");
  const row=run("shoppingRow('kvinoja','2026-11-02')");
  assert.match(run("procurementRowHtml(shoppingRow('kvinoja','2026-11-02'))"),/<label class="purchase-select"><input type="checkbox"/);
  run("togglePurchase('kvinoja','week','2026-11-02')");
  assert.ok(run("procurementSection('Test','',[shoppingRow('kvinoja','2026-11-02')],'test')").includes('0 još za kupiti'));
  assert.ok(run("procurementRowHtml(shoppingRow('kvinoja','2026-11-02'))").includes('checked'));
});
test('dialog backdrop does not swallow native controls inside the dialog', () => {
  const run=app();
  run("let prevented=false,closed=false;closeModal=()=>{closed=true};const backdrop={tagName:'DIV',dataset:{action:'close-modal-bg'},closest:s=>s==='[data-action]'?backdrop:null};const summary={closest:()=>backdrop};testEvents.click.forEach(fn=>fn({target:summary,preventDefault(){prevented=true}}))");
  assert.equal(run('prevented'),false);assert.equal(run('closed'),false);
  run("testEvents.click.forEach(fn=>fn({target:backdrop,preventDefault(){prevented=true}}))");
  assert.equal(run('closed'),true);
});
test('spice needs follow the selected recipes, distinguish paprika types and merge four actual weeks', () => {
  const run=app();run("state.docs['plans/2026-11-02']=emptyPlan('2026-11-02');setSlot('2026-11-02',0,'v','V13')");
  let needs=run("spiceNeeds('2026-11-02')");
  for(const id of ['kurkuma','kumin','dimljena','papar'])assert.equal(needs[id].count,1);
  assert.equal(needs.sol,undefined,'salt is optional, not a requirement of the tofu recipe');
  assert.equal(needs.slatka,undefined);assert.equal(needs.menta,undefined);
  run("setSlot('2026-11-02',1,'l','R12');setSlot('2026-11-02',2,'b','D04');setSlot('2026-11-02',3,'v','V05')");
  for(const id of ['menta','vlasac','cesnjak_prah'])assert.ok(run(`spiceNeeds('2026-11-02')['${id}']`),`${id}: Croatian inflection`);
  run("setSlot('2026-11-02',0,'v','V15')");needs=run("spiceNeeds('2026-11-02')");
  assert.ok(needs.djumbir);assert.equal(needs.kurkuma,undefined);
  run("CURATED_MENU.weeks.forEach(w=>state.docs['plans/'+w.week]=w)");
  const total=run("spiceNeeds('2026-11-02','month').kumin.count");
  assert.equal(total,run("shoppingWeeks('2026-11-02').reduce((n,w)=>n+(spiceNeeds(w).kumin?.count||0),0)"));
  for(const id of ['ruzmarin','timijan','lovor','mazuran','muskat','menta','kopar','vlasac','bosiljak'])assert.ok(run(`spiceNeeds('2026-11-02','month')['${id}']`),id);
});
test('spice pantry persists across periods while fresh herbs stay weekly and all survive export/import', () => {
  const run=app();run("state.docs['settings/main']={names:{T:'Test'},favorites:['R14']};state.docs['shopping/2026-11-02']={checked:{jaja:true},stock:{jaja:100}};setSpiceOwned('origano','2026-11-02',true);setSpiceOwned('persin','2026-11-02',true)");
  assert.ok(run("spiceOwned(SPICES.find(s=>s.id==='origano'),'2026-12-07')"));
  assert.ok(!run("spiceOwned(SPICES.find(s=>s.id==='persin'),'2026-11-09')"));
  assert.equal(run("state.docs['shopping/2026-11-02'].stock.jaja"),100);
  assert.ok(run("state.docs['shopping/2026-11-02'].checked.jaja"));
  const exported=run('JSON.stringify(exportData())');run('closeModal=()=>{};state.docs={}');run(`importData(${JSON.stringify(exported)})`);
  assert.ok(run("spiceOwned(SPICES.find(s=>s.id==='persin'),'2026-11-02')"));
  assert.ok(run("spiceOwned(SPICES.find(s=>s.id==='origano'),'2026-11-02')"));
  assert.equal(run('settings().names.T'),'Test');assert.ok(run("favorites().has('R14')"));
  run("setSpiceOwned('origano','2026-11-02',false)");assert.ok(!run("settings().spicePantry.origano"));
});
test('shopping exports include spices once for the pantry and herbs per actual week, with optional items labelled', () => {
  const run=app();run("CURATED_MENU.weeks.forEach(w=>state.docs['plans/'+w.week]=w);setSpiceOwned('origano','2026-11-02',true)");
  const text=run("shoppingText('2026-11-02','month')");
  assert.equal((text.match(/\[x\] Imam Origano, sušeni/g)||[]).length,1);
  assert.equal((text.match(/SVJEŽE \/ SMRZNUTO BILJE/g)||[]).length,4);
  assert.ok(text.includes('PO ŽELJI · NIJE OBAVEZNA KUPOVINA'));
  assert.ok(!text.includes('Međuobroci i začini po ukusu nisu uključeni'));
  assert.ok(run("spiceModal({start:'2026-11-02',mode:'month',tab:'needed'},'')").includes('Kurkuma'));
  assert.ok(!run("spiceModal({start:'2026-11-02',mode:'month',tab:'needed'},'')").includes('Čili pahuljice'));
});
test('recipes show finished preparation without editorial history or a separate report',()=>{
  const run=app(),all=run('[...RECIPES,...SNACKS]');
  for(const r of all){
    assert.equal(r.review,undefined,r.id);
    if(r.steps){
      assert.ok(r.steps.length>0);
      const detail=run(`viewRecipeDetail(RB['${r.id}'])`);
      assert.ok(!detail.includes('pregled-recepata.html')&&!detail.includes('Za ravnotežu obroka'),r.id);
      assert.ok(!r.steps.some(s=>/\d+\s*\/\s*\d+\s*\/\s*\d+/.test(s)),`${r.id}: no fixed serving ratios`);
    } else assert.ok(r.prep&&r.prep.length>30,r.id);
  }
  assert.ok(!run('viewRecipes()').includes('pregled-recepata.html'));
  run("state.rmeal='snacks'");const snacks=run('viewRecipes()');
  assert.ok(snacks.includes(run('SB.S02.prep')));
  assert.ok(!snacks.includes('Okus i ravnoteža'));
});
test('old report links open the finished cookbook and retain valid recipe anchors',()=>{
  const page=fs.readFileSync(path.join(base,'pregled-recepata.html'),'utf8');
  const script=page.match(/<script>([\s\S]*?)<\/script>/)[1];
  for(const [hash,expected] of [['#V12','./#recepti/V12'],['#R15','./#recepti/R15'],['','./#recepti'],['#S02','./#recepti']]){
    let target;
    vm.runInNewContext(script,{location:{hash,replace:url=>target=url}});
    assert.equal(target,expected);
  }
  assert.ok(!page.includes('Najvažniji zaključci')&&!page.includes('Nalaz.'));
});
test('changed quantities feed both shopping and portions, with child exclusions applied before totals',()=>{
  const run=app();run("state.docs['plans/2026-11-02']=emptyPlan('2026-11-02');setSlot('2026-11-02',0,'l','R10');setSlot('2026-11-02',1,'l','R11')");
  assert.equal(run("weekShopping('2026-11-02').feta"),130);
  assert.equal(run("wholeOf(RB.R02).cesnjak"),6);
  assert.equal(run("wholeOf(RB.R07).limun"),15);
  assert.equal(run("wholeOf(RB.V11).ulje"),20);
  assert.equal(run("gramsFor(RB.V07,'K').kapari"),undefined);
  assert.equal(run("gramsFor(RB.V07,'K').masline"),undefined);
  assert.ok(Math.abs(run("wholeOf(RB.V07).kapari")-17.6)<1e-8);
});
test('label corrections propagate into cached snack nutrition and do not fabricate missing micronutrients',()=>{
  const run=app();
  assert.equal(run('ING.posni_sir.n.na'),96);
  assert.equal(run('ING.posni_sir.n.ca'),null);
  assert.equal(run('ING.mlijeko2.n.vd'),null);
  assert.equal(run('ING.mlijeko3.n.vd'),null);
  for(const sn of run('SNACKS'))for(const p of ['T','S']){
    const calculated=run(`nutOf(SB['${sn.id}'].per['${p}'])`);
    for(const [key,value] of Object.entries(calculated))assert.ok(Math.abs(value-sn.nut[p][key])<0.001,`${sn.id}/${p}/${key}`);
  }
});
