# Vinted Seller OS — MVP plan

AI-asistirani radni prostor za pripremu Vinted oglasa. Čovjek uvijek odobrava; aplikacija nikad ne objavljuje na Vinted i ne koristi scraping ni automatizaciju.

## Što gradimo

**Prijava** — privatni radni prostor, e-mail + lozinka. Svi podaci vidljivi su samo vlasniku.

**Dashboard** — kartice s brojkama (Skice, Spremno, Aktivno, Prodano, Procijenjena vrijednost zaliha), popis zadnjih artikala, glavni gumb "Dodaj artikl".

**Dodaj artikl** — povuci-i-ispusti više fotografija, jedan artikl po grupi fotografija, neobavezna polja: brand, kategorija, veličina, stanje, nabavna cijena. Gumb "Analiziraj s AI".

**AI radni prostor** — galerija, prepoznata polja (brand, model, kategorija, potkategorija, boja, materijal, veličina, stanje, vidljivi nedostaci) s oznakama pouzdanosti, sva polja uređiva. Generirani naslov, opis na hrvatskom, ključne riječi. Cijene: preporučena, za brzu prodaju, minimalna prihvatljiva + obrazloženje. Gumbi: Generiraj ponovno, Spremi skicu, Odobri oglas.

**Inventar** — tablica: SKU, naslov, brand, kategorija, trošak, cijena, status, datum. Statusi: Skica, Spremno, Objavljeno, Rezervirano, Prodano, Poslano. Pretraga, filteri, skupna promjena statusa.

**Detalj oglasa** — sve fotografije i podaci, gumbi Kopiraj naslov / Kopiraj opis / Kopiraj sve, izvoz CSV i JSON, povijest izmjena.

**Istraživanje cijena** — usporedivi oglasi (izvor URL, uočena cijena, datum provjere, bilješke), ručni unos u MVP-u, pripremljeno za kasniju web-pretragu. Jasna napomena: tržišna orijentacija, ne jamstvo prodajne cijene.

**Postavke** — profil prodavača, valuta EUR, jezik hrvatski, ton oglasa, postavke marži i cijena.

## Dizajn

Premium minimalistički resale SaaS: tamni ugljen/crna + topli neutralni tonovi, izražena tipografija, puno bjeline, kartice s tankim rubovima i suzdržanim sjenama. Sve boje kao tokeni u dizajn-sustavu, shadcn/ui komponente, pristupačno i responzivno (desktop first).

## Tehnički dio

- Lovable Cloud (Postgres + Auth + Storage) uključen; fotografije u privatnom storage bucketu.
- Tablice: `profiles`, `items`, `item_images`, `listings`, `pricing_research`, `listing_versions`, `activity_log`. RLS na svakoj, vezano na `auth.uid()`, uz potrebne GRANT-ove.
- SKU `LP-VNT-0001` generiran u bazi (sekvenca po korisniku, trigger).
- Demo artikli: ubacuju se jednim gumbom "Učitaj demo podatke" pri praznom inventaru (podaci su po korisniku, pa se ne mogu unaprijed umetnuti u migraciju).
- AI kao servisni sloj (`src/lib/ai/`) s mock providerom iza jednog sučelja `analyzeListing(images, hints)` — kasnije se spaja pravi vision model bez promjene UI-a.
- Web-istraživanje isto kroz `src/lib/research/` s mock providerom.
- Sav pozivni kod na serveru (server functions); nikakvi ključevi u frontendu.
- Stanja učitavanja, prazna stanja, greške i potvrde; validacija formi (Zod + react-hook-form).

## Izvan opsega v1

Plaćanja, timovi, društvene funkcije, automatska objava na Vinted, bilo kakav scraping ili korištenje Vinted sesija.
