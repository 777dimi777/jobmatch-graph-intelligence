# Demonstracija projekta - 10 minuta

1. **0:00-1:00 - Ideja:** JobMatch povezuje kandidate, vestine, oglase, kompanije i profesionalnu mrezu u Neo4j grafu.
2. **1:00-2:00 - Model:** pokazati `GRAPH_MODEL.md`, pa objasniti HAS_SKILL, REQUIRES_SKILL i KNOWS.
3. **2:00-3:00 - Dashboard:** pokazati stvarne brojace i top trazene vestine.
4. **3:00-4:30 - Preporuke:** kandidat Marko, score, poklopljene i nedostajuce vestine; naglasiti mandatory pravilo.
5. **4:30-6:00 - Graf mreza:** ucitati podgraf oko Marka, pokazati selekciju cvora i shortest path.
6. **6:00-7:00 - Entiteti:** otvoriti kandidata, posao i kompaniju; pokazati da podaci dolaze iz graf relacija.
7. **7:00-8:00 - Analitika/GDS:** top skills, slicni kandidati i Louvain zajednice.
8. **8:00-9:00 - Cypher:** pokrenuti pripremljeni upit iz kataloga; objasniti zasto nema slobodnog terminala.
9. **9:00-10:00 - Performanse:** pokrenuti PROFILE, pokazati vreme, broj redova i plan; pomenuti benchmark skriptu.

Pre demonstracije proveriti: `docker compose ps` mora pokazivati `healthy`, zatim `npm run seed:small`, `npm run dev` i `npm run benchmark`.
