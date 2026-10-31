# Za naš stol

Obiteljski jelovnik na hrvatskom: dnevni obroci, tjedni plan, recepti, kupovina i dnevnik.

Aplikacija je statična i objavljuje se na GitHub Pages. Nema instalacije paketa ni build koraka.

## Lokalni pregled

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Otvori `http://127.0.0.1:4173`. Za provjeru logike, porcija, planiranja, izvora, slika i offline ponašanja:

```sh
node --test tests/*.test.cjs
```

## Struktura i podaci

- `index.html`: izvorna baza namirnica i recepata te logika aplikacije.
- `experience.css`: vizualni izgled i prilagodbe mobitelu/računalu.
- `spices.js`: popis začina prema receptima, trajne oznake za suhu ostavu, tjedne oznake za svježe bilje i prijedlozi kombinacija.
- `shopping.js`: kupovina prema pakiranjima, početna zaliha, četverotjedni pregled i postavljanje pripremljenog jelovnika.
- `shopping-data.js`: primjeri pakiranja i ugrađeni jelovnik; ažurirati zajedno s izvornim podacima u `data/`.
- `data/four-week-menu.json`: 84 obroka za 2.–29. studenoga 2026.
- `data/shopping-storage-sources.json`: izvori za čuvanje hrane i pravila izračuna kupovine.
- `assets/meals/`: optimizirane AI slike, manifest i opis generiranja.
- `data/recipe-sources.json`: izvori šest recepata s kvinojom, heljdom i tofuom te USDA podataka.
- `data/beef-recipe-sources.json`: izvori šest jela s ramstekom, biftekom i junećom plećkom, profili komada mesa i upute za pečenje.
- `data/recipe-review.json`: pregled svih 42 recepta i 6 međuobroka, nalazi i obrazloženje izmjena od 31. 10. 2026.
- `pregled-recepata.html`: čitljiv izvještaj s poveznicama na recepte, izrađen naredbom `python3 scripts/build_recipe_review.py`.
- `sw.js`: offline aplikacija i predmemorija pregledanih slika.

Postojeći ključevi `zns:` u localStorage ostaju isti. Favoriti i postavke pakiranja dio su `settings/main` i uključeni su u izvoz/uvoz. Izbor teme čuva se na uređaju. Sama nadogradnja ne mijenja spremljeni plan, dnevnik, imena ili omjere porcija. „Pogledaj jelovnik” otvara kartice dana s fotografijama, odabirom tjedna i zamjenom obroka. Za već postavljen jelovnik uređivač učitava spremljene planove, uključujući ručne izmjene. Zamjene ostaju radna kopija do pritiska na Spremi. Spremiti se može trenutno odabrani tjedan ili sva četiri; samo izmijenjeni tjedni i njihovi popisi spremaju se u `planner/latest` za povrat. Ponovno spremanje jednakog jelovnika čuva tu kopiju.

## Tjedna i velika kupovina

Velika kupovina obuhvaća četiri stvarna plana od odabranog ponedjeljka. Za ostavu i zamrzivač potrebe se zbrajaju prije zaokruživanja na pakiranja; svježe namirnice prikazuju se odvojeno za svaki tjedan. Iznimka su konzerve i slična pakiranja koja kratko traju nakon otvaranja: njihove zadane postavke zaokružuju svaki tjedan zasebno. Korisnik može promijeniti pakiranje i način čuvanja svake namirnice.

Početna zaliha čuva se u `shopping/YYYY-MM-DD.stock`, zajednički za tjedni i četverotjedni pregled s istim početnim datumom. Oduzima se jednom. Kvačice u `shopping/` i `shopping-month/` označavaju kupnju, ali ne mijenjaju zalihu. Prikazani ostatak je projekcija, a za novo razdoblje unosi se stvarna dostupna zaliha. Promjena potrebnih količina poništava valjanost starih kvačica. Svi ovi podaci i kopija plana uključeni su u izvoz/uvoz.

Popisi pokrivaju planirane doručke, ručkove i večere za postojeće obiteljske porcije; međuobroci nisu uključeni. Začini su zaseban popis izveden iz polja `spices` u odabranim receptima. Njihova pakiranja su prijedlozi dopune, ne izračun potrošnje. Oznake „Imam” za suhu ostavu čuvaju se u `settings/main.spicePantry`, a za svježe bilje u `shopping/YYYY-MM-DD.herbs`; oba su uključena u izvoz/uvoz. Kopiranje i preuzimanje kupovine uključuje i začine, uz jasno odvojene neobavezne dodatke. Konzerve koriste ocijeđenu masu, a jaja se prikazuju u komadima. Ulje i soja umak u receptima koriste grame pa se mililitri s boce ne pretvaraju automatski u grame. Pakiranja su promjenjivi primjeri, ne tvrdnje o dostupnosti kod trgovaca.

Fotografije su AI ilustracije načina posluživanja, a ne dokumentacija skuhanih jela. Novi recepti imaju poveznice na izvorne objavljene recepte i opisuju obiteljske prilagodbe; prilagodbe nisu zasebno kuhinjski testirane. Nutritivne vrijednosti su procjene prema sirovim/suhim namirnicama. Nedostajući podaci u USDA bazi ostaju označeni kao `null`; zbrojevi mogu biti nepotpuni.

Pregled recepata poboljšava pripremu i daje konkretne savjete za okus i ravnotežu; ne predstavlja kuhinjsko testiranje niti potvrdu osobnih kalorijskih potreba. Promjene količina dio su zajedničkog `DATA` modela, pa ih koriste kupovina, porcije i nutritivni izračun. Predloženi jelovnik i korisnički zapisi nisu zamijenjeni. Kod ručno prilagođenih porcija i dalje vrijede korisnički izbori. Izračun svježeg posnog sira koristi označeni primjer deklaracije MEGGLE (1,9 g masti, 0,24 g soli/100 g); nije pretpostavka o korisnikovoj marki. Nedeklarirani mikronutrijenti ostaju `null`. Vitamin D iz generičkog mlijeka nije uračunat bez potvrde obogaćivanja na deklaraciji. Predizračunati međuobroci usklađeni su s istim podacima.

Nakon promjena u pregledu regeneriraj `pregled-recepata.html` naredbom `python3 scripts/build_recipe_review.py`. Prije objave pokreni `python3 scripts/version_assets.py`, zatim `node --test tests/*.test.cjs`. Skripta dodaje hash sadržaja u URL svakog vanjskog CSS/JS resursa te usklađuje offline popis i verziju u `sw.js`. Tako i stari aktivni service worker pri prvom otvaranju novog HTML-a dohvaća pripadajuće nove stilove i skripte. Izvještaj i aplikacija spremaju se kao odvojene offline stranice. Testovi provjeravaju usklađenost URL-ova s datotekama. Slike se spremaju nakon prvog učitavanja; nedostupna slika ima lokalnu SVG zamjenu.
