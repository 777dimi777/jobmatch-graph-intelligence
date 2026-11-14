# Cypher upiti

Svi upiti su u servisima pod `apps/api/src/modules`. Vrednosti su parametri `$...`, sto sprecava Cypher injection i omogucava plan cache.

## Preporuka posla

`RecommendationsService` spaja kandidata i aktivan posao, a zatim u podupitu poredi `HAS_SKILL.level` i `REQUIRES_SKILL.minLevel`. Sabira tezine samo za vestine sa dovoljnim nivoom:

```cypher
MATCH (candidate:Candidate {id:$candidateId})
MATCH (job:Job {active:true})-[:POSTED_BY]->(company:Company)
CALL {
  WITH candidate, job
  OPTIONAL MATCH (job)-[requirement:REQUIRES_SKILL]->(skill:Skill)
  OPTIONAL MATCH (candidate)-[owned:HAS_SKILL]->(skill)
  WHERE owned.level >= requirement.minLevel
  RETURN sum(requirement.weight) AS totalWeight,
         sum(CASE WHEN owned IS NULL THEN 0 ELSE requirement.weight END) AS matchedWeight,
         sum(CASE WHEN requirement.mandatory AND owned IS NULL THEN 1 ELSE 0 END) AS missingMandatory
}
RETURN CASE WHEN totalWeight=0 THEN 0
       ELSE round(100.0 * matchedWeight/totalWeight,1) END AS score
```

Obavezna vestina koja nedostaje diskvalifikuje posao u podrazumevanom prikazu. `totalWeight=0` eksplicitno vraca nulu; skor nije AI verovatnoca zaposlenja.

## Mreza

Zajednicki kontakti koriste dva neusmerena `KNOWS` hop-a. Najkraca putanja koristi `shortestPath` sa granicom sest relacija. Podgraf interpolira samo validiranu dubinu 1-3, pa ne otvara neogranicenu pretragu.

```cypher
MATCH (a:Candidate {id:$from}), (b:Candidate {id:$to})
MATCH path = shortestPath((a)-[:KNOWS*..6]-(b))
RETURN [node IN nodes(path) | node { .id, .name, .title }], length(path)
```

Predlog novih kontakata racuna kandidate udaljene dva hop-a i izbacuje vec postojeci `KNOWS`; broj razlicitih posrednika je signal za rangiranje.

## Analitika i slicnost

Najtrazenije vestine: `MATCH (:Job {active:true})-[:REQUIRES_SKILL]->(s:Skill) RETURN s.name, count(*)`. Slicnost kandidata je Jaccard: presek zajednickih vestina podeljen unijom svih vestina. Upit najpre prikupi zajednicke vestine, pa izbroji skup vestina oba kandidata; rezultat nije GDS, vec proverljiva Cypher alternativa.

## Katalog i PROFILE

`QueriesService` drzi belu listu cetiri upita. `POST /api/queries/execute` prima samo ID i parametre datog upita. `Neo4jService.profile` dodaje `PROFILE`, meri vreme na API strani i vraca stvarni plan iz Neo4j summary-ja. Time UI ne moze da izvrsi proizvoljnu komandu.
