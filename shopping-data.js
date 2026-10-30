/* Editable package examples and the prepared family menu. */
const SHOP_DEFAULTS = {
  "pileca_prsa": {
    "packSize": 500,
    "storage": "freezer",
    "note": "Primjer pakiranja. Za kupnju na vagu postavi 0; odvoji porcije i zamrzni za kasnije tjedne."
  },
  "pileci_batak": {
    "packSize": 500,
    "storage": "freezer",
    "note": "Primjer pakiranja. Za kupnju na vagu postavi 0; odvoji porcije i zamrzni za kasnije tjedne."
  },
  "pureca_mljevena": {
    "packSize": 500,
    "storage": "freezer",
    "note": "Primjer pakiranja. Za kupnju na vagu postavi 0; odvoji porcije i zamrzni za kasnije tjedne."
  },
  "junetina_mljevena": {
    "packSize": 500,
    "storage": "freezer",
    "note": "Primjer pakiranja. Za kupnju na vagu postavi 0; odvoji porcije i zamrzni za kasnije tjedne."
  },
  "svinjski_lungic": {
    "packSize": 500,
    "storage": "freezer",
    "note": "Primjer pakiranja. Za kupnju na vagu postavi 0; odvoji porcije i zamrzni za kasnije tjedne."
  },
  "ramstek": {
    "packSize": 500,
    "storage": "freezer",
    "note": "Primjer pakiranja. Za kupnju na vagu postavi 0; odvoji porcije i zamrzni za kasnije tjedne."
  },
  "biftek": {
    "packSize": 500,
    "storage": "freezer",
    "note": "Primjer pakiranja. Za kupnju na vagu postavi 0; odvoji porcije i zamrzni za kasnije tjedne."
  },
  "juneca_plecka": {
    "packSize": 500,
    "storage": "freezer",
    "note": "Primjer pakiranja. Za kupnju na vagu postavi 0; odvoji porcije i zamrzni za kasnije tjedne."
  },
  "losos": {
    "packSize": 500,
    "storage": "freezer",
    "note": "Očišćeni jestivi dio bez kosti. Zamrzni porcije prema uputi na pakiranju."
  },
  "oslic": {
    "packSize": 500,
    "storage": "freezer",
    "note": "Očišćeni jestivi dio bez kosti. Zamrzni porcije prema uputi na pakiranju."
  },
  "srdele": {
    "packSize": 90,
    "storage": "pantry",
    "note": "Neotvorena konzerva. Veličina pakiranja mora biti ocijeđena masa s deklaracije. Za veliku kupnju pakiranja se računaju po tjednima, bez pretpostavke da otvoreni višak traje četiri tjedna.",
    "packLabel": "konzerva · 90 g ocijeđeno",
    "weeklyPacks": true
  },
  "dimljeni_losos": {
    "packSize": 100,
    "storage": "fresh",
    "note": "Kupi prema roku uporabe i uputi proizvođača; ovo nije sirovi filet za mjesečnu zalihu."
  },
  "jaja": {
    "packSize": 500,
    "storage": "fresh",
    "note": "Primjer: 10 jaja, po 50 g jestivog dijela. U postavkama prikazuj komade; ne zamrzavaj u ljusci.",
    "packLabel": "10 kom"
  },
  "jogurt2": {
    "packSize": 500,
    "storage": "fresh",
    "note": "Primjer pakiranja; provjeri rok i upute nakon otvaranja."
  },
  "jogurt5": {
    "packSize": 500,
    "storage": "fresh",
    "note": "Primjer pakiranja; provjeri rok i upute nakon otvaranja."
  },
  "posni_sir": {
    "packSize": 500,
    "storage": "fresh",
    "note": "Primjer pakiranja; provjeri rok i upute nakon otvaranja."
  },
  "skyr": {
    "packSize": 150,
    "storage": "fresh",
    "note": "Primjer čašice; provjeri rok i upute nakon otvaranja."
  },
  "feta": {
    "packSize": 200,
    "storage": "fresh",
    "note": "Primjer pakiranja; slijedi upute čuvanja nakon otvaranja."
  },
  "parmezan": {
    "packSize": 100,
    "storage": "fresh",
    "note": "Primjer pakiranja; veću zalihu kupi samo uz odgovarajući rok i uvjete čuvanja."
  },
  "mozzarella": {
    "packSize": 125,
    "storage": "fresh",
    "note": "Primjer: 125 g sira bez tekućine. Provjeri neto/ocijeđenu masu."
  },
  "mlijeko2": {
    "packSize": 1000,
    "storage": "fresh",
    "note": "Nije unaprijed označeno kao UHT. Za trajno neotvoreno mlijeko možeš promijeniti u Ostava.",
    "packLabel": "1 l"
  },
  "mlijeko3": {
    "packSize": 1000,
    "storage": "fresh",
    "note": "Nije unaprijed označeno kao UHT. Za trajno neotvoreno mlijeko možeš promijeniti u Ostava.",
    "packLabel": "1 l"
  },
  "zob": {
    "packSize": 500,
    "storage": "pantry",
    "note": "Suha namirnica; čuvaj zatvoreno prema deklaraciji."
  },
  "integralni_kruh": {
    "packSize": 500,
    "storage": "freezer",
    "note": "Nareži i zamrzni u porcijama; izvadi samo koliko treba."
  },
  "pita": {
    "packSize": 400,
    "storage": "freezer",
    "note": "Primjer ukupne mase paketa. Odvoji porcije za zamrzavanje prema deklaraciji."
  },
  "tjestenina_int": {
    "packSize": 500,
    "storage": "pantry",
    "note": "Veličina pakiranja odnosi se na suhu namirnicu."
  },
  "tjestenina": {
    "packSize": 500,
    "storage": "pantry",
    "note": "Veličina pakiranja odnosi se na suhu namirnicu."
  },
  "bulgur": {
    "packSize": 500,
    "storage": "pantry",
    "note": "Veličina pakiranja odnosi se na suhu namirnicu."
  },
  "palenta": {
    "packSize": 500,
    "storage": "pantry",
    "note": "Veličina pakiranja odnosi se na suhu namirnicu."
  },
  "leca_crvena": {
    "packSize": 500,
    "storage": "pantry",
    "note": "Veličina pakiranja odnosi se na suhu namirnicu."
  },
  "leca": {
    "packSize": 500,
    "storage": "pantry",
    "note": "Veličina pakiranja odnosi se na suhu namirnicu."
  },
  "slanutak": {
    "packSize": 240,
    "storage": "pantry",
    "note": "Neotvorena konzerva. Unesi ocijeđenu masu, ne ukupnu masu s tekućinom. Za veliku kupnju pakiranja se računaju po tjednima, bez pretpostavke da otvoreni višak traje četiri tjedna.",
    "packLabel": "konzerva · 240 g ocijeđeno",
    "weeklyPacks": true
  },
  "bijeli_grah": {
    "packSize": 240,
    "storage": "pantry",
    "note": "Neotvorena konzerva. Unesi ocijeđenu masu, ne ukupnu masu s tekućinom. Za veliku kupnju pakiranja se računaju po tjednima, bez pretpostavke da otvoreni višak traje četiri tjedna.",
    "packLabel": "konzerva · 240 g ocijeđeno",
    "weeklyPacks": true
  },
  "njoki": {
    "packSize": 500,
    "storage": "fresh",
    "note": "Svježi njoki: provjeri rok. U Zamrzivač prebaci samo ako deklaracija dopušta zamrzavanje."
  },
  "brasno_int": {
    "packSize": 1000,
    "storage": "pantry",
    "note": "Suho pakiranje; čuvaj zatvoreno prema deklaraciji."
  },
  "brasno": {
    "packSize": 1000,
    "storage": "pantry",
    "note": "Suho pakiranje; čuvaj zatvoreno prema deklaraciji."
  },
  "humus": {
    "packSize": 200,
    "storage": "fresh",
    "note": "Primjer pakiranja; provjeri rok i upute nakon otvaranja."
  },
  "prasak": {
    "packSize": 12,
    "storage": "pantry",
    "note": "Primjer vrećice; promijeni veličinu prema deklaraciji.",
    "packLabel": "vrećica · 12 g"
  },
  "krumpir": {
    "packSize": 0,
    "storage": "fresh",
    "note": "Kupnja na vagu: prikazana je potrebna jestiva količina; za zapakirano odaberi veličinu pakiranja."
  },
  "luk": {
    "packSize": 0,
    "storage": "fresh",
    "note": "Kupnja na vagu: prikazana je potrebna jestiva količina; za zapakirano odaberi veličinu pakiranja."
  },
  "cesnjak": {
    "packSize": 0,
    "storage": "fresh",
    "note": "Kupnja na vagu: prikazana je potrebna jestiva količina; za zapakirano odaberi veličinu pakiranja."
  },
  "mrkva": {
    "packSize": 0,
    "storage": "fresh",
    "note": "Kupnja na vagu: prikazana je potrebna jestiva količina; za zapakirano odaberi veličinu pakiranja."
  },
  "celer": {
    "packSize": 0,
    "storage": "fresh",
    "note": "Kupnja na vagu: prikazana je potrebna jestiva količina; za zapakirano odaberi veličinu pakiranja."
  },
  "paprika": {
    "packSize": 0,
    "storage": "fresh",
    "note": "Kupnja na vagu: prikazana je potrebna jestiva količina; za zapakirano odaberi veličinu pakiranja."
  },
  "rajcica": {
    "packSize": 0,
    "storage": "fresh",
    "note": "Kupnja na vagu: prikazana je potrebna jestiva količina; za zapakirano odaberi veličinu pakiranja."
  },
  "tikvice": {
    "packSize": 0,
    "storage": "fresh",
    "note": "Kupnja na vagu: prikazana je potrebna jestiva količina; za zapakirano odaberi veličinu pakiranja."
  },
  "patlidzan": {
    "packSize": 0,
    "storage": "fresh",
    "note": "Kupnja na vagu: prikazana je potrebna jestiva količina; za zapakirano odaberi veličinu pakiranja."
  },
  "brokula": {
    "packSize": 0,
    "storage": "fresh",
    "note": "Kupnja na vagu: prikazana je potrebna jestiva količina; za zapakirano odaberi veličinu pakiranja."
  },
  "krastavac": {
    "packSize": 0,
    "storage": "fresh",
    "note": "Kupnja na vagu: prikazana je potrebna jestiva količina; za zapakirano odaberi veličinu pakiranja."
  },
  "avokado": {
    "packSize": 0,
    "storage": "fresh",
    "note": "Kupnja na vagu: prikazana je potrebna jestiva količina; za zapakirano odaberi veličinu pakiranja."
  },
  "banana": {
    "packSize": 0,
    "storage": "fresh",
    "note": "Kupnja na vagu: prikazana je potrebna jestiva količina; za zapakirano odaberi veličinu pakiranja."
  },
  "jabuka": {
    "packSize": 0,
    "storage": "fresh",
    "note": "Kupnja na vagu: prikazana je potrebna jestiva količina; za zapakirano odaberi veličinu pakiranja."
  },
  "kruska": {
    "packSize": 0,
    "storage": "fresh",
    "note": "Kupnja na vagu: prikazana je potrebna jestiva količina; za zapakirano odaberi veličinu pakiranja."
  },
  "pasirana": {
    "packSize": 500,
    "storage": "pantry",
    "note": "Neotvoreno pakiranje. Nakon otvaranja čuvaj prema deklaraciji. Za veliku kupnju pakiranja se računaju po tjednima, bez pretpostavke da otvoreni višak traje četiri tjedna.",
    "weeklyPacks": true
  },
  "spinat": {
    "packSize": 200,
    "storage": "fresh",
    "note": "Svježi špinat. Za kupljeni smrznuti proizvod promijeni spremanje i veličinu pakiranja."
  },
  "blitva": {
    "packSize": 500,
    "storage": "fresh",
    "note": "Primjer svežnja po masi; prilagodi kupljenoj i očišćenoj količini."
  },
  "gljive": {
    "packSize": 250,
    "storage": "fresh",
    "note": "Primjer pakiranja svježih gljiva."
  },
  "rukola": {
    "packSize": 125,
    "storage": "fresh",
    "note": "Primjer pakiranja svježe rukole."
  },
  "salata": {
    "packSize": 200,
    "storage": "fresh",
    "note": "Primjer očišćene salate; za kupnju na vagu postavi 0."
  },
  "masline": {
    "packSize": 150,
    "storage": "pantry",
    "note": "Pretpostavljena neotvorena staklenka; koristi ocijeđenu masu. Nakon otvaranja prema deklaraciji. Za veliku kupnju pakiranja se računaju po tjednima, bez pretpostavke da otvoreni višak traje četiri tjedna.",
    "weeklyPacks": true
  },
  "kapari": {
    "packSize": 100,
    "storage": "pantry",
    "note": "Pretpostavljena neotvorena staklenka; koristi ocijeđenu masu. Nakon otvaranja prema deklaraciji. Za veliku kupnju pakiranja se računaju po tjednima, bez pretpostavke da otvoreni višak traje četiri tjedna.",
    "weeklyPacks": true
  },
  "limun": {
    "packSize": 0,
    "storage": "fresh",
    "note": "Količina je u ml soka, ne gramima cijelih limuna. Upiši pakiranje soka ili vlastiti prinos po limunu."
  },
  "borovnice": {
    "packSize": 450,
    "storage": "freezer",
    "note": "Plan kupovine pretpostavlja smrznute borovnice; za svježe odaberi Svježe."
  },
  "orasi": {
    "packSize": 200,
    "storage": "pantry",
    "note": "Primjer pakiranja; čuvaj zatvoreno prema deklaraciji."
  },
  "bademi": {
    "packSize": 200,
    "storage": "pantry",
    "note": "Primjer pakiranja; čuvaj zatvoreno prema deklaraciji."
  },
  "kikiriki_maslac": {
    "packSize": 350,
    "storage": "pantry",
    "note": "Primjer staklenke; nakon otvaranja slijedi upute proizvođača."
  },
  "lan": {
    "packSize": 200,
    "storage": "pantry",
    "note": "Primjer pakiranja; nakon otvaranja slijedi upute čuvanja, osobito za mljeveni lan."
  },
  "bucine": {
    "packSize": 200,
    "storage": "pantry",
    "note": "Primjer pakiranja; nakon otvaranja slijedi upute čuvanja, osobito za mljeveni lan."
  },
  "ulje": {
    "packSize": 0,
    "storage": "pantry",
    "note": "Recepti računaju grame. Boca u ml nije ista količina u g; upiši masu pakiranja prema deklaraciji."
  },
  "med": {
    "packSize": 450,
    "storage": "pantry",
    "note": "Primjer staklenke po neto masi."
  },
  "senf": {
    "packSize": 200,
    "storage": "pantry",
    "note": "Neotvorena staklenka/tuba; nakon otvaranja prema deklaraciji."
  },
  "whey": {
    "packSize": 1000,
    "storage": "pantry",
    "note": "Primjer pakiranja; upiši neto masu svojeg proizvoda."
  },
  "herbalife_f1": {
    "packSize": 550,
    "storage": "pantry",
    "note": "Primjer pakiranja; veličina ovisi o proizvodu i tržištu, provjeri neto masu."
  },
  "herbalife_pdm": {
    "packSize": 588,
    "storage": "pantry",
    "note": "Primjer pakiranja; veličina ovisi o proizvodu i tržištu, provjeri neto masu."
  },
  "kvinoja": {
    "packSize": 500,
    "storage": "pantry",
    "note": "Veličina pakiranja odnosi se na suhu namirnicu."
  },
  "heljda": {
    "packSize": 500,
    "storage": "pantry",
    "note": "Veličina pakiranja odnosi se na suhu namirnicu."
  },
  "tofu": {
    "packSize": 200,
    "storage": "fresh",
    "note": "Pretpostavljen rashlađeni tofu. Slijedi rok i upute nakon otvaranja; promijeni spremanje prema proizvodu."
  },
  "soja_umak": {
    "packSize": 0,
    "storage": "pantry",
    "note": "Neotvoren umak prema deklaraciji. Recepti računaju g, a boce često ml; nemoj izjednačiti jedinice."
  },
  "riza_integralna": {
    "packSize": 1000,
    "storage": "pantry",
    "note": "Riža se računa suha. Primjer pakiranja od 1 kg.",
    "packLabel": "1 kg"
  }
};
const CURATED_MENU = {
  "title": "Četiri raznolika tjedna za naš stol",
  "start": "2026-11-02",
  "weeks": [
    {
      "week": "2026-11-02",
      "days": [
        {
          "b": "D01",
          "l": "R11",
          "v": "V10",
          "montaza": false
        },
        {
          "b": "D02",
          "l": "R01",
          "v": "V13",
          "montaza": false
        },
        {
          "b": "D03",
          "l": "R12",
          "v": "V09",
          "montaza": false
        },
        {
          "b": "D07",
          "l": "R13",
          "v": "V15",
          "montaza": false
        },
        {
          "b": "D10",
          "l": "R08",
          "v": "V07",
          "montaza": false
        },
        {
          "b": "D04",
          "l": "R14",
          "v": "V11",
          "montaza": false
        },
        {
          "b": "D06",
          "l": "R07",
          "v": "V05",
          "montaza": false
        }
      ]
    },
    {
      "week": "2026-11-09",
      "days": [
        {
          "b": "D09",
          "l": "R10",
          "v": "V12",
          "montaza": false
        },
        {
          "b": "D10",
          "l": "R13",
          "v": "V07",
          "montaza": false
        },
        {
          "b": "D04",
          "l": "R15",
          "v": "V05",
          "montaza": false
        },
        {
          "b": "D01",
          "l": "R06",
          "v": "V13",
          "montaza": false
        },
        {
          "b": "D02",
          "l": "R11",
          "v": "V10",
          "montaza": false
        },
        {
          "b": "D03",
          "l": "R03",
          "v": "V09",
          "montaza": false
        },
        {
          "b": "D07",
          "l": "R16",
          "v": "V01",
          "montaza": false
        }
      ]
    },
    {
      "week": "2026-11-16",
      "days": [
        {
          "b": "D03",
          "l": "R12",
          "v": "V13",
          "montaza": false
        },
        {
          "b": "D09",
          "l": "R13",
          "v": "V14",
          "montaza": false
        },
        {
          "b": "D10",
          "l": "R11",
          "v": "V03",
          "montaza": false
        },
        {
          "b": "D07",
          "l": "R06",
          "v": "V05",
          "montaza": false
        },
        {
          "b": "D01",
          "l": "R01",
          "v": "V12",
          "montaza": false
        },
        {
          "b": "D02",
          "l": "R04",
          "v": "V11",
          "montaza": false
        },
        {
          "b": "D06",
          "l": "R02",
          "v": "V16",
          "montaza": false
        }
      ]
    },
    {
      "week": "2026-11-23",
      "days": [
        {
          "b": "D05",
          "l": "R11",
          "v": "V10",
          "montaza": false
        },
        {
          "b": "D08",
          "l": "R08",
          "v": "V13",
          "montaza": false
        },
        {
          "b": "D04",
          "l": "R09",
          "v": "V04",
          "montaza": false
        },
        {
          "b": "D10",
          "l": "R13",
          "v": "V09",
          "montaza": false
        },
        {
          "b": "D09",
          "l": "R12",
          "v": "V07",
          "montaza": false
        },
        {
          "b": "D03",
          "l": "R06",
          "v": "V06",
          "montaza": false
        },
        {
          "b": "D07",
          "l": "R07",
          "v": "V01",
          "montaza": false
        }
      ]
    }
  ],
  "notes": [
    "Plan pokriva 28 dana, od 2. do 29. studenoga 2026.; to su četiri tjedna za kupovinu, a ne cijeli kalendarski studeni.",
    "Prvi tjedan: kvinoja u ponedjeljak i srijedu, tofu u utorak, kremasta heljda i biftek u četvrtak, ramstek u subotu. Riblji obroci su losos u utorak i srdele u petak.",
    "Svaki tjedan sadrži 21 različit recept, dva obroka s junetinom i četiri s peradi. Ručak i večera uvijek imaju različit glavni izvor proteina.",
    "Doručci se izmjenjuju slatko/slano kroz svih 28 dana; raspored koristi svih 10 postojećih doručaka.",
    "U prva tri tjedna su po dva riblja ručka/večere. U četvrtom tjednu riblji obroci su tost s dimljenim lososom u ponedjeljak za doručak i tjestenina sa srdelama u petak za večeru.",
    "Sporo pirjana plećka je u nedjelju 15. studenoga, a gulaš s heljdom u nedjelju 22. studenoga. Jela radnim danom traju najviše 45 minuta prema vremenu u receptima.",
    "Svih 12 novih recepata s kvinojom, heljdom, tofuom i junetinom uključeno je do kraja trećeg tjedna. Ukupno se kroz četiri tjedna izmjenjuje 39 postojećih recepata.",
    "Ponavljanja između tjedana namjerna su: 84 obroka nije moguće popuniti s 42 recepta bez ponavljanja. Nema ponavljanja unutar pojedinog tjedna.",
    "Plan određuje samo recepte i dane. Postojeće obiteljske porcije, raspodjela, ciljevi i odabrani međuobroci ostaju prema postavkama aplikacije.",
    "Svi dani imaju montaza:false jer nisu navedeni terenski dani; korisnik ih može označiti i zamijeniti ručak hladnim jelom.",
    "Popis za kupovinu treba zbrojiti ova četiri različita tjedna. Količine za 28 dana ne dobivaju se množenjem samo prvog tjedna s četiri."
  ]
};
