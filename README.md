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
- `assets/meals/`: optimizirane AI slike, manifest i opis generiranja.
- `data/recipe-sources.json`: izvori šest recepata s kvinojom, heljdom i tofuom te USDA podataka.
- `data/beef-recipe-sources.json`: izvori šest jela s ramstekom, biftekom i junećom plećkom, profili komada mesa i upute za pečenje.
- `sw.js`: offline aplikacija i predmemorija pregledanih slika.

Postojeći ključevi `zns:` u localStorage ostaju isti. Favoriti su dio `settings/main` i uključeni su u postojeći izvoz/uvoz. Izbor teme čuva se na uređaju. Nova verzija ne mijenja spremljeni plan, dnevnik, imena ili omjere porcija.

Fotografije su AI ilustracije načina posluživanja, a ne dokumentacija skuhanih jela. Novi recepti imaju poveznice na izvorne objavljene recepte i opisuju obiteljske prilagodbe; prilagodbe nisu zasebno kuhinjski testirane. Nutritivne vrijednosti su procjene prema sirovim/suhim namirnicama. Nedostajući podaci u USDA bazi ostaju označeni kao `null`; zbrojevi mogu biti nepotpuni.

Pri promjeni aplikacije promijeni `VERSION` u `sw.js` kako bi nova predmemorija preuzela aktualni HTML/CSS. Slike se spremaju nakon prvog učitavanja; nedostupna slika ima lokalnu SVG zamjenu.
