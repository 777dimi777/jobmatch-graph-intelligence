# Vodic kroz projekat

1. Pokrenuti `docker compose up -d` i sacekati Neo4j.
2. Pokrenuti `npm run seed:small`. U `seed.ts` se prvo kreiraju constraints/indeksi, zatim cvorovi, a potom veze preko `MERGE`.
3. Otvoriti dashboard. Kartice dolaze iz jednog Cypher overview upita. Graf je stvarni podgraf oko `candidate-1` i mozete promeniti ID i dubinu.
4. U Kandidatima, Poslovima, Kompanijama i Vestinama proveriti CRUD/pregled modela. API se dokumentuje na `/api/docs`.
5. U Preporukama pokrenuti racunanje za `candidate-1`; otvoriti i nekvalifikovane poslove da se vide nedostajuce obavezne vestine.
6. U Graf mrezi traziti najkracu putanju izmedju dva kandidata. Ako je nema u sest koraka, to je ispravan rezultat.
7. U Analitici pokazati top vestine i Jaccard slicnost. Ako je GDS instaliran, pozvati `/api/analytics/communities` iz Swagger-a.
8. U Neo4j upitima pokrenuti jedan katalog upit. Objasniti zasto UI ne prima slobodni Cypher.
9. U Performansama pozvati PROFILE i pogledati stvarni plan. Za reproducibilnu seriju pokrenuti `npm run benchmark`.

Za odbranu redosled demonstracije treba da bude: model -> seed -> preporuka -> putanja -> analitika/GDS -> PROFILE. Tako je jasno da je graf baza centralna, a ne samo pozadina web aplikacije.
