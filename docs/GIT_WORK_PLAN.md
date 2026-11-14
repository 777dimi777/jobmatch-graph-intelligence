# Plan rada i Git commit-a

Ovaj plan sluzi da Git istorija iskreno prati naredni rad. Commit se pravi samo nakon stvarno odradjenog i proverjenog koraka tog dana. Ne menjati datum commita i ne praviti prazne commit-e samo zbog istorije.

| Datum | Stvarni fokus | Predlozen commit |
| --- | --- | --- |
| 14.11.2026. | Pokretanje Neo4j-a, seed, ispravke API injekcije i Cypher grupisanja | `fix: connect Neo4j services and repair Cypher aggregations` |
| 15.11.2026. | Proci Candidate CRUD u Swagger-u; dodati jos testova za validaciju | `test: cover candidate validation and CRUD edge cases` |
| 16.11.2026. | Doraditi Jobs, Companies i Skills detalje/filtere | `feat: improve catalogue filtering and detail endpoints` |
| 17.11.2026. | Proveriti i objasniti preporuke za vise kandidata | `feat: refine explainable job recommendations` |
| 18.11.2026. | Rucno demonstrirati shortest path, zajednicke i predlozene kontakte | `feat: validate professional network traversal` |
| 19.11.2026. | Dodati i testirati GDS Louvain prikaz u analitici | `feat: present Louvain community analysis` |
| 20.11.2026. | Dotegnuti Cytoscape graf: filteri, selekcija i detalji veze | `feat: improve interactive graph exploration` |
| 21.11.2026. | Doraditi dashboard i responsive prikaz sa stvarnim podacima | `feat: polish dashboard data presentation` |
| 22.11.2026. | Proci katalog Cypher upita i dodati objasnjenja rezultata | `docs: expand Cypher query catalogue explanations` |
| 23.11.2026. | Izmeriti benchmark za small profil i sacuvati rezultate | `perf: record small dataset query benchmarks` |
| 24.11.2026. | Pokrenuti medium seed i uporediti PROFILE planove | `perf: compare medium dataset query plans` |
| 25.11.2026. | Pregled constraints, indeksa i `EXPLAIN` planova | `docs: document index and query plan rationale` |
| 26.11.2026. | Proci README od praznog Docker stanja na drugom racunaru ili nalogu | `docs: verify reproducible local setup` |
| 27.11.2026. | Dopuniti pitanja za odbranu i pripremiti demo scenario | `docs: prepare final defense walkthrough` |
| 28.11.2026. | Finalni lint, testovi, build i manuelna provera svih stranica | `chore: complete release verification` |
| 29.11.2026. | Samo stvarne ispravke pronadjene na probnoj odbrani | `fix: address final demo feedback` |
| 30.11.2026. | Tag/verzija i objava na udaljenom repozitorijumu | `chore: prepare project topic submission` |

## Pravila za svaki radni dan

1. Pre rada: `git status` i `git pull --rebase` kada postoji udaljeni repozitorijum.
2. Posle rada: pokrenuti relevantne provere (`npm run lint`, `npm test`, po potrebi `npm run build`).
3. Pregledati `git diff`, zatim napraviti jedan smislen commit sa porukom iz tabele ili preciznijom porukom.
4. Push uraditi tek kada je commit provereno ispravan.

Prvi commit je inicijalni, stvaran snapshot trenutnog projekta. Dalji commit-i nastaju iskljucivo kada se zaista uradi stavka iz plana.
