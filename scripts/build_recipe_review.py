"""Generate the readable, offline-friendly review from the checked recipe catalogue."""
from pathlib import Path
import json,re,html

root=Path(__file__).resolve().parent.parent
review=json.loads((root/'data/recipe-review.json').read_text())
data=json.loads(re.search(r'const DATA = (.*);',(root/'index.html').read_text()).group(1))
catalogue={r['id']:r for r in data['recipes']+data['snacks']}
e=html.escape
def link(url,label):return f'<a href="{e(url)}" target="_blank" rel="noopener noreferrer">{e(label)} ↗</a>'
sources=review['sources']
cards=[]
for prefix,title in [('D','Doručci'),('R','Ručkovi'),('V','Večere'),('S','Međuobroci')]:
    rows=[]
    for item in review['recipes']:
        if not item['id'].startswith(prefix):continue
        r=catalogue[item['id']]
        changes=[]
        for c in item.get('quantityChanges',[]):
            ing=data['ingredients'][c['ingredient']]
            changes.append(f'{ing["name"]}: {c["before"]:g} → {c["after"]:g} {ing["unit"]}')
        if item.get('timeBefore')!=item.get('timeAfter'):
            changes.append(f'Okvirno ukupno vrijeme: {item["timeBefore"]} → {item["timeAfter"]} min')
        original=link(r['source']['url'],r['source']['title']) if r.get('source') else 'Obiteljski recept; procjena prema sastojcima i postupku, bez tvrdnje o kuhinjskom testiranju.'
        rows.append(f'''<article id="{item['id']}"><div class="row"><span class="code">{item['id']}</span><a href="./#recepti/{item['id']}"{' hidden' if prefix=='S' else ''}>Otvori recept →</a></div>
<h3>{e(r['title'])}</h3><p><b>Nalaz.</b> {e(item['finding'])}</p><p><b>Za bolji okus.</b> {e(item['flavor'])}</p><p><b>Za ravnotežu.</b> {e(item['balance'])}</p>
{f'<p class="change">{e(" · ".join(changes))}</p>' if changes else ''}<p class="source">{original}</p></article>''')
    cards.append(f'<section id="{prefix}"><h2>{title}</h2><div class="grid">{"".join(rows)}</div></section>')

page=f'''<!doctype html><html lang="hr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Okus i ravnoteža · pregled svih recepata | Za naš stol</title>
<style>
:root{{color-scheme:light;--ink:#263e32;--green:#41654d;--muted:#657168;--line:#dce1d7}}*{{box-sizing:border-box}}body{{margin:0;background:#f6f5ef;color:var(--ink);font:16px/1.65 system-ui,sans-serif}}main{{max-width:1120px;margin:auto;padding:32px 24px 64px}}a{{color:#315c40;text-underline-offset:4px}}.back{{font-size:.9rem}}header{{max-width:850px;padding:35px 0 20px}}.eyebrow,.code{{font-size:.75rem;letter-spacing:.12em;text-transform:uppercase;color:var(--green);font-weight:700}}h1{{font-family:Georgia,serif;font-size:clamp(2.2rem,6vw,3.8rem);line-height:1.12;margin:14px 0 22px}}h2{{font:700 1.8rem Georgia,serif;margin:42px 0 18px}}h3{{font-size:1.16rem;line-height:1.35;margin:12px 0 18px}}p{{margin:0 0 13px}}.lead{{font-size:1.15rem}}.overview{{padding:24px;border-radius:20px;background:#e9efe2}}nav{{display:flex;gap:12px;flex-wrap:wrap;margin-top:22px}}nav a{{padding:9px 15px;border:1px solid var(--line);border-radius:24px;background:#fff;text-decoration:none}}.grid{{display:grid;grid-template-columns:1fr 1fr;gap:18px}}article{{background:#fff;border:1px solid var(--line);border-radius:18px;padding:24px;scroll-margin-top:20px}}.row{{display:flex;justify-content:space-between;gap:12px}}.row a{{font-size:.8rem}}article p{{font-size:.92rem}}.source{{font-size:.76rem!important;color:var(--muted);border-top:1px solid var(--line);padding-top:12px;margin-top:18px}}.change{{background:#f1f4ed;padding:10px;border-radius:10px;font-size:.82rem!important}}.notice{{color:var(--muted);font-size:.9rem}}.sources li{{margin:8px 0}}[hidden]{{display:none!important}}@media(max-width:700px){{main{{padding:20px 16px 40px}}header{{padding-top:25px}}.grid{{grid-template-columns:1fr}}article{{padding:20px}}.overview{{padding:20px}}}}@media print{{body{{background:white;font-size:11pt}}main{{padding:0}}.back,nav,.row a{{display:none}}.grid{{display:block}}article{{break-inside:avoid;margin:15px 0;border-radius:0}}h2{{break-after:avoid}}a{{text-decoration:none}}}}
</style></head><body><main><a class="back" href="./#recepti">← Za naš stol · recepti</a>
<header><span class="eyebrow">Pregled 31. listopada 2026. · 42 recepta + 6 međuobroka</span><h1>Zdravo i ukusno.<br>Što zadržati, što poboljšati.</h1>
<p class="lead">Osnova jelovnika je dobra: raznovrsno povrće, mahunarke, cjelovite žitarice, riba i različiti izvori proteina. Najviše prostora za okus ima u sočnosti, zapečenosti, aromi i pravilnom završavanju jela.</p>
<p class="notice">Ovo je pregled recepata i izvora, bez kuhanja i kušanja. Ne može potvrditi „najbolji okus” za vašu obitelj. Izmjene su blage polazne verzije; nakon kuhanja prilagodite kiselost i začine vlastitom ukusu.</p></header>
<section class="overview"><h3>Najvažniji zaključci</h3>
<p><b>Više okusa kroz pripremu.</b> Gljive i tofu peci u turama, žitarice ocijedi i rastresi, jogurt dodaj izvan jake vatre, a svježe bilje na kraju. Ovo su kulinarske procjene za konkretna jela; kombinacije bilja i kiseline podupiru i {link(sources[2]['url'],'savjeti Action on Salt')}.</p>
<p><b>Sol provjeri prije dosoljavanja.</b> Feta, parmezan, masline, kapari, dimljena riba, kruh i sojin umak već je donose. WHO za odrasle preporučuje manje od 5 g soli dnevno, a zasićene masti ispod 10 % energije. Cilj je raznovrstan obrazac prehrane, ne samo puno proteina ili malo kalorija. {link(sources[0]['url'],'WHO: zdrava prehrana')}</p>
<p><b>Junetina ostaje u rotaciji.</b> Pripremljeni četverotjedni plan ima dva obroka s crvenim mesom tjedno. Pri zamjenama računaj i svinjetinu; WCRF preporučuje najviše približno 350–500 g kuhanog/pečenog crvenog mesa tjedno po odrasloj osobi. To nije isto što i sirova masa u aplikaciji. {link(sources[1]['url'],'WCRF')}</p>
<p><b>Djeci pripremu prilagodi od početka.</b> Odvoji sastojke označene „Bez” prije miješanja. Čili je dodatak odraslima na tanjuru, orašasti plodovi za malo dijete fino su mljeveni, a med nije za dijete mlađe od godinu dana. {link(sources[4]['url'],'NHS')}</p>
<p><b>Sočno, uz provjeru termometrom.</b> Perad 74 °C; mljevena junetina 71 °C; cijeli odresci govedine i svinjetine 63 °C uz najmanje tri minute odmora; riba 63 °C. Ne produžuj pečenje mesa samo zato što prilog još nije gotov. {link(sources[3]['url'],'FoodSafety.gov')}</p>
<p><b>Ispravljene procjene.</b> Svježi sir više se ne računa kao američki cottage sir. Primjer obračuna sada je deklaracija MEGGLE svježeg posnog sira: 72 kcal, 10,8 g proteina, 1,9 g masti i 0,24 g soli na 100 g. To nije tvrdnja da kupujete upravo taj proizvod. Nedeklarirani mikronutrijenti ostaju nepoznati; vitamin D iz mlijeka nije uračunat bez potvrde obogaćivanja. {link(sources[5]['url'],'Deklaracija proizvođača')}</p>
<p class="notice">Procjene ne uključuju dodanu sol i sve začine. Vaša marka namirnice, izmjene porcija i stvarno pojedena količina mijenjaju rezultat. Niži izračun natrija nakon ispravka profila sira ne dokazuje da ste stvarno smanjili unos soli. Osobni kalorijski ciljevi i djetetove potrebe ovim pregledom nisu potvrđeni.</p></section>
<nav aria-label="Skupine recepata"><a href="#D">10 doručaka</a><a href="#R">16 ručkova</a><a href="#V">16 večera</a><a href="#S">6 međuobroka</a></nav>
{''.join(cards)}
<section><h2>Kako čitati izmjene</h2><p>Količine prije i poslije odnose se na osnovni zajednički recept; stvarna kupovina primjenjuje postotke, izostavljene sastojke i osobne dodatke. Ukupno ulje nije povećano. Okvirna vremena uključuju pripremu, ali ovise o veličini komada, posuđu i pećnici.</p><p>Izvorni objavljeni recept i naša prilagodba nisu ista stvar. Nove količine i postupci nisu zasebno kuhinjski testirani. Uz svaki recept u aplikaciji dostupni su praktični savjeti, a ovdje i nalaz pregleda.</p></section>
<section><h2>Izvori pregleda</h2><ul class="sources">{''.join('<li>'+link(s['url'],s['title'])+'</li>' for s in sources)}</ul></section>
</main></body></html>'''
(root/'pregled-recepata.html').write_text(page)
print('Built review for',len(review['recipes']),'items.')
