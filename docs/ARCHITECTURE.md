# Arhitektura

```text
Next.js (apps/web) -- REST/JSON --> NestJS (apps/api) -- Bolt --> Neo4j
     Cytoscape / Recharts              services             property graph
```

Frontend je Next.js App Router aplikacija. Server stranice ucitavaju pregled, analitiku i dashboard preko `lib/api.ts`; klijentske komponente obavljaju pretrage, menjaju cvor/dubinu Cytoscape grafa i pokrecu pripremljene upite.

API ima tanke kontrolere i servise po domenima (`Candidates`, `Jobs`, `Companies`, `Skills`, `Graph`, `Recommendations`, `Analytics`, `Queries`, `Performance`). `Neo4jService` je jedino mesto koje otvara Bolt sesije. Read/write sesije se zatvaraju posle svakog poziva, a kreiranje kandidata i posla koristi `executeWrite` transakciju.

API nikada ne sklapa Cypher od korisnickog teksta. Sve vrednosti su parametri; jedini interpolirani deo je dubina podgrafa, prethodno pretvorena i ogranicena na 1-3. Katalog upita ne prihvata proizvoljni Cypher.

Docker Compose podize Neo4j Community na portovima 7474/7687 i trazi `graph-data-science` dodatak. Ako GDS ne moze da se inicijalizuje, osnovne graf funkcije i Cypher Node Similarity alternativa ostaju dostupni, a `/analytics/communities` vraca iskrenu gresku umesto laznog rezultata.
