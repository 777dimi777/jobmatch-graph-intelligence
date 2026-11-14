# JobMatch Graph Intelligence

Profesionalna mreza i preporuka poslova sa Neo4j property graf bazom. Projekat namerno stavlja graf model, Cypher upite, transakcije, indekse i analizu planova ispred samog UI-ja.

## Brzo pokretanje

1. Kopirati `.env.example` u `.env`.
2. Pokrenuti bazu: `docker compose up -d`.
3. Instalirati pakete: `npm install`.
4. Nakon sto Neo4j healthcheck postane zdrav, napraviti razvojne podatke: `npm run seed:small`.
5. Pokrenuti aplikacije: `npm run dev`.
6. Otvoriti `http://localhost:3000`; Swagger je na `http://localhost:3001/api/docs`.

## Komande

| Komanda | Namena |
| --- | --- |
| `npm run dev` | Next.js i NestJS u razvoju |
| `npm run build` | TypeScript/Next produkcioni build |
| `npm run test` | Unit testovi matching formule |
| `npm run seed:small` | oko 1.100 cvorova, za demonstraciju |
| `npm run seed:medium` | oko 10.000 cvorova, za funkcionalni test |
| `npm run seed:large` | oko 48.000 cvorova, za merenja |
| `npm run benchmark` | stvarni PROFILE rezultati u `apps/api/benchmarks/latest.json` |

Seed koristi fiksirani generator i `MERGE`, pa ponovni poziv ne duplira isti skup. Ne mesati razlicite profile bez ciscenja Docker volumena ako je potreban strogo izolovan benchmark: `docker compose down -v`, zatim ponovo `up` i seed.

## Struktura

```text
apps/api       NestJS REST API, Cypher, seed, benchmark i testovi
apps/web       Next.js dashboard i Cytoscape vizualizacija
docs/          model, upiti, algoritmi, performanse i priprema odbrane
docker-compose.yml  Neo4j Community + GDS Docker dodatak
```

CRUD endpointi se namerno smatraju lokalnim demonstracionim API-jem. Nema autentifikacije i ne smeju se izlagati javno bez autorizacije, rate limit-a i odgovarajuce kontrole pristupa.

Za stvarne Neo4j integracione testove, nakon podizanja baze, pokrenuti `RUN_NEO4J_INTEGRATION=true npm test`. Bez te promenljive integracioni test je preskocen, kako lokalni unit test ne bi zahtevao pokrenut Docker.

Detalji su u [arhitekturi](docs/ARCHITECTURE.md), [modelu grafa](docs/GRAPH_MODEL.md), [Cypher upitima](docs/CYPHER_QUERIES.md), [algoritmima](docs/ALGORITHMS.md), [performansama](docs/PERFORMANCE.md) i [vodicu za odbranu](docs/DEFENSE_PREPARATION.md).

Ako ucis projekat od pocetka, kreni od [puta ucenja](docs/LEARNING_PATH.md), zatim prodji [skriptu za demonstraciju](docs/DEMO_SCRIPT.md). Pravila za iskren, postepen Git rad nalaze se u [planu rada i commit-a](docs/GIT_WORK_PLAN.md).
