const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const base = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(base, 'index.html'), 'utf8');
const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].slice(1).map(m => m[1]).join('\n').replace(/\nboot\(\);\s*$/, '\n');
function app() {
  const storage = new Map();
  const context = vm.createContext({
    console, setTimeout, clearTimeout, setInterval, clearInterval, URL,
    document: { addEventListener() {} }, window: { addEventListener() {} },
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
    assert.ok(detail.includes(r.source.url) && detail.includes('recipe-source'));
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
