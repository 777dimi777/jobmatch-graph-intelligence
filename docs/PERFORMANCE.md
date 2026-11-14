# Performanse i indeksi

## Indeksi

| Naziv | Svojstvo | Upit koji pomaze |
| --- | --- | --- |
| `*_id_unique` | `id` svih 7 labela | lookup kandidata, posla, lokacije i svih relacija po ID-u |
| `candidate_name` | Candidate.name | pretraga kandidata (filter i sortiranje) |
| `candidate_email` | Candidate.email | integritet i lookup profila |
| `skill_name` | Skill.name | kandidati sa React/odredjenom vestinom |
| `job_active_created` | Job.active, Job.createdAt | aktivni oglasi sortirani po datumu |
| `company_name`, `location_name` | ime | pretraga i filteri |

Indeksi nisu zamena za dobar obrazac grafa: preporuka mora procitati veze zahteva za svaki kandidat-posao par, pa se indeks primarno koristi za polazni cvor.

## Metodologija

1. Izabrati profil seed-a (`small`, `medium`, `large`) i zabeleziti ga.
2. Pokrenuti `npm run benchmark` nakon toplog starta baze.
3. Izmeriti kandidat po ID-u, kandidati po vestini, shortest path i top-skills agregaciju.
4. Sacuvati generisani `apps/api/benchmarks/latest.json` uz izvestaj.
5. U UI otvoriti Performanse, pokrenuti PROFILE i proveriti operator u `plan` objektu.

Repozitorijum namerno ne sadrzi izmisljene milisekunde. Rezultati zavise od lokalnog hardvera, JVM cache-a, velicine seed-a i pokrenutih procesa.

## Ocekivanja i kompromisi

`NodeIndexSeek` je pozeljan za ID lookup. Za analitiku su `Expand(All)`, agregacija i sortiranje normalni, jer se namerno obilaze veze. Ogranicenja dubine (`..6`, `1..3`) stite putanje i vizualizaciju. Prevelika projekcija celog grafa za GDS trosi memoriju; zato community endpoint projektuje samo potrebne label/relacije i zatim brise projekciju.
