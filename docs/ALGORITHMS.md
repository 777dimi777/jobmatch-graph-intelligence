# Algoritmi

## Matching poslova

Za svaki zahtev posla proverava se da li kandidat ima istu vestinu i `level >= minLevel`. Ako je uslov tacan, tezina zahteva ulazi u brojilac. Imenilac je zbir svih tezina zahteva:

`score = matchedWeight / totalWeight * 100`

Nedostajuce obavezne vestine se posebno broje. Podrazumevana lista filtrira poslove sa `missingMandatory > 0`; opcioni parametar omogucava da se prikažu radi ucenja i objasni razlog diskvalifikacije. Rezultat prikazuje poklopljene i nedostajuce vestine.

`calculateMatch` je mala cista TypeScript funkcija za unit testove, dok produkcioni skor racuna Cypher da backend ne cita ceo graf u memoriju.

## Putanje i preporuka kontakata

Za najkracu putanju koristi se Neo4j `shortestPath` preko najvise sest `KNOWS` veza. Za preporuku kontakta obrazac je `candidate-[:KNOWS]-mutual-[:KNOWS]-suggestion`; postojece poznanstvo i sam kandidat se iskljucuju. Rang je broj zajednickih kontakata.

## Node Similarity

Trenutna implementacija koristi Cypher Jaccard alternativu: zajednicke `Skill` cvorove deli brojem vestina u uniji. Prikazuje oba kandidata, brojcani skor i nazive zajednickih vestina. Prednost je sto radi bez GDS dodatka; mana je sto nije optimizovana kao GDS projekcija za veoma velike grafove.

## Community Detection (GDS)

Kada je GDS dodatak raspoloziv, endpoint projektuje samo `Candidate` cvorove i `KNOWS` veze, poziva `gds.louvain.stream`, grupise po `communityId`, pa odmah brise imenovanu projekciju. Louvain bira grupe sa gustim unutrasnjim vezama i retkim vezama izmedju grupa. Rezultat predstavlja strukturu seed/profesionalne mreze, ne dokaz stvarne drustvene grupe. Endpoint ne salje fiktivne zajednice ako GDS nije dostupan.
