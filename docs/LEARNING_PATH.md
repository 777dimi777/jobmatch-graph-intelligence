# Kako da razumes projekat od pocetka do odbrane

Ne uci napamet ceo repozitorijum. Prati ovaj redosled i za svaku tacku otvori navedeni fajl, pokreni upit ili stranicu i svojim recima objasni rezultat.

## 1. Prvo: pokretanje i granice sistema

- Procitaj `README.md` i pokreni `docker compose up -d`, `npm run seed:small`, `npm run dev`.
- Objasni: Next.js prikazuje UI, NestJS izvrsava poslovnu logiku, a Neo4j cuva cvorove i veze.
- Provera: otvori `http://localhost:3001/api/docs` i pozovi `GET /api/analytics/overview`.

## 2. Property graph model

- Procitaj `docs/GRAPH_MODEL.md` i `apps/api/src/database/seed.ts`.
- Nacrtaj bez gledanja: `Candidate -[:HAS_SKILL]-> Skill <-[:REQUIRES_SKILL]- Job -[:POSTED_BY]-> Company`.
- Zatim dodaj `KNOWS`, `LOCATED_IN`, `BELONGS_TO`, sertifikate i prijave.
- Ključno pitanje: zasto je `HAS_SKILL.level` svojstvo veze, a ne svojstvo Skill cvora? Zato sto je nivo razlicit za svakog kandidata.

## 3. Integritet i seed

- Otvori `apps/api/src/database/schema.ts`: svaki entitet ima unique `id`, a indeksi postoje samo za konkretne lookup/filter upite.
- Otvori `seed.ts`: fixed-seed generator pravi poslovno povezane podatke; `MERGE` sprecava dupliranje, a seed cisti stare veze da bi rezultat ostao deterministicki.
- Pokreni seed dva puta i proveri `GET /api/analytics/overview`: broj veza ostaje isti.

## 4. Najvazniji Cypher - preporuka posla

- Otvori `apps/api/src/modules/recommendations.ts` i stranicu **Preporuke**.
- Kandidat poseduje vestinu samo ako `owned.level >= requirement.minLevel`.
- Formula je `matchedWeight / totalWeight * 100`.
- Ako nedostaje mandatory vestina, posao je u regularnom prikazu iskljucen. To nije AI verovatnoca zaposljavanja, vec objasnjivi skor.
- Pokazi Marka (`candidate-1`) i posao `job-9`: seed namerno obezbedjuje potpun match da demonstracija bude reproducibilna.

## 5. Profesionalna mreza

- Otvori `apps/api/src/modules/graph.ts` i stranicu **Graf mreza**.
- `KNOWS` se cuva jednom (kanonska veza) a cita neusmereno sa `-[:KNOWS]-`.
- Demonstriraj zajednicke kontakte, predlog kontakta i `shortestPath` sa granicom od sest koraka.
- Objasni granice dubine: stite bazu od nekontrolisanih traversala.

## 6. Analitika i GDS

- U **Analitici** prvo pokaži top-skills agregaciju.
- Node similarity je Cypher Jaccard alternativa: presek zajednickih vestina / unija vestina.
- Louvain endpoint projektuje samo Candidate + KNOWS graf, poziva GDS, vraca broj clanova zajednice i brise privremenu projekciju.
- Ne govori da zajednica dokazuje realnu drustvenu grupu; to je algoritamski signal.

## 7. Performanse

- Pokreni `npm run benchmark` i zatim **Performanse** stranicu.
- Razlika: `EXPLAIN` ne izvrsava upit; `PROFILE` ga izvrsava i vraca plan/statistiku.
- Za lookup po ID objasni unique constraint i indeks; za analitiku je normalno da se traversiraju veze.
- Nikada ne navodi unapred zapisane milisekunde: pokazi lokalno izmereni rezultat.

## 8. Zavrsna proba odbrane

Bez gledanja u kod, odgovori na: zasto Neo4j, zasto Skill cvor, zasto relacijska svojstva, kako se racuna score, kako se sprecava duplikat KNOWS, sta radi transakcija, sta radi GDS i sta citamo iz PROFILE plana.

Kada bilo koji odgovor ne mozes da objasnis prostim recima, vrati se na konkretni servis, pokreni endpoint u Swagger-u i proveri rezultat pre nego sto nastavis.
