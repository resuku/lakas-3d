# Munkamód (Claude)

A program leírása, futtatása, adatmodellje és szkriptjei a `README.md`-ben vannak. Ez a fájl a munkaszabályokat rögzíti.

## Projektkontextus

- A felújítás forrásai a `../Felujítás/Doc` mappában vannak. Először a `00_Lakasfelujitas_CONTEXT.txt`-t, majd a `Lakasfelujitas_handoff_aktualis.txt`-t olvasd el. A 2026-11-02-i felhasználói közlések a V15 naplóban és a handoffban szerepelnek; a 2026-11-03-iak (kiemelt javaslatok, aljavaslatok, átszámozás – régi → új tábla) csak a handoff 11. fejezetében, a forráslista- és katalógusbővítés (2026-11-04) a 12.-ben. Az `old` mappát ne használd forrásként.
- Ne találj ki méretet. Minden szám `{v, s, note, src}` formában szerepel, a `src` a live naplóra mutat. Ellenőrzés: `npm run check-data`.
- A Felújítás live forrásait (napló, CONTEXT, handoff, Konszignáció) csak kifejezett jóváhagyással módosítsd. Döntést ne jelölj véglegesnek. A J-javaslatok és a világítási tervek javaslatok, nem döntések.
- A napló szoros megkötései (D-/ND-/DD- döntések) irányelvek, nem minden esetben szabályok. Ha egy megkötés kizárna egy lehetőséget, mutasd meg azt is, és kérdezz rá.
- Bútornál és dekornál mindig jelöld a méret forrását (`basis`: naplósor, lakberendezői konszignáció vagy feltételezés). A katalógustermék jelölt, nem kiválasztott termék.
- Katalógusbővítésnél a boltok botellenőrzését (Cloudflare, captcha) ne kerüld meg. Ilyenkor a Wayback Machine mentése használható: `archiveUrl` = a mentés, `checkedAt` = a mentés dátuma, az ár „(bolt, archív ÉÉÉÉ-HH-NN)”. Az archive.org-ról kérésenként legalább 6 s szünettel tölts (gyorsabban 429-et ad). A beszerzési forráslista hozzáférési besorolása mutatja, melyik bolt olvasható (handoff 12. fejezet).
- Új katalógustermék után a J-javaslatok és aljavaslatok bútorai is változhatnak (rangsor, `rankSlot`): vesd össze előtte–utána, és jelezd a usernek.

## Parancsok

- Minden projektparancs a konténerben fut: `docker compose exec dev …`. A hoston ne futtass npm-et vagy pythont.
- A Python-szkriptek is konténerben futnak: `MSYS_NO_PATHCONV=1 docker run --rm -v "$(pwd -W):/w" -w /w python:3.12-slim python -X utf8 scripts/…`. Git Bash alatt a konténeren belüli útvonalakhoz `MSYS_NO_PATHCONV=1` kell.
- Változtatás után futtasd a `npm run typecheck` és a `npm run check-data` parancsot. A képi ellenőrzéshez `scripts/shot.sh`-val készíts képet, és nézd meg.
- Kész funkció után indítsd újra a dev szervert (`docker compose exec -d dev npm run dev -- --host 0.0.0.0`), hogy a felhasználó ki tudja próbálni.

## Generált fájlok, tárolt állapot

- Kézi adat: a `src/data/furnishing.ts` (bútor-helyőrzők, konszignáció-tervezet), a `src/data/decor.ts` (dekortípusok), a `src/data/subVariants.ts` (aljavaslatok: lehetőségek, rangsorhely, dekor) és a `src/data/products/furniture.json` (bútorkatalógus). A J-javaslatok bútorai futásidőben számolódnak (`src/lib/furnitureSets.ts`). A `check-data` a javaslat termékhivatkozásait is ellenőrzi.
- A `src/data/variants.ts` a `scripts/gen/gen_variants.py`, a `src/data/lightPlans.ts` a `scripts/gen/gen_lightplans.py` kimenete. A J-javaslatokat és a hozzájuk tartozó világítást a generátorban módosítsd, utána futtasd.
- A J-javaslatok megjelenített száma és sorrendje a `scripts/gen/numbering.py`-ban van (elöl a kiemelt, aljavaslatos javaslatok; a `SUB_PARENTS` a `src/data/subVariants.ts`-ben ugyanez). Az azonosító (`j5-melyzold`, `lj5`, aljavaslat `j5-a`) a régi számot őrzi – ne nevezd át, mert a mentett beállítások, vélemények és galériaképek erre hivatkoznak. Átszámozásnál a store-ba `migrateState` ág kell (lásd v11).
- Ha alapváltozat vagy -terv törlődik, illetve a tárolt állapot formája megváltozik, növeld a `STORE_VERSION` értékét, és írj hozzá `migrateState` ágat (`src/store.ts`). A betöltött konfigurációs fájlok is ezen mennek át.
- Ha a javaslatokról újra képek készülnek, frissítsd a galériát: `scripts/gallery.py --public` (lásd a README-t). A képek bútorokkal készülnek; 16 változat × 5 nézet a fej nélküli böngészőben 20 percnél is tovább tart, ezért két részletben, a háttérben futtasd.

## Git és kirakás

- A tároló nyilvános (`github.com/resuku/lakas-3d`). Ami a `main` ágra kerül, kb. 1–2 perc múlva megjelenik a <https://resuku.github.io/lakas-3d/> oldalon. A user minden változást előbb helyben próbál ki: commitot és feltöltést csak kifejezett kérésre végezz.
- A commitok a tárolószintű git-identitással (GitHub noreply cím) készülnek. Ezt ne írd át, és a globális git-beállítás címét ne használd. Személyes adat (e-mail-cím, pontos lakcím) nem kerülhet a tárolóba.
