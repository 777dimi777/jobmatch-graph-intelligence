# Priprema za usmenu odbranu

1. **Zasto Neo4j?** Podaci imaju mnogo prirodnih odnosa: kandidat-vestina-posao-kompanija i profesionalna mreza; traversali su prirodniji nego veliki JOIN-ovi.
2. **Sta je property graph?** Model sa oznacenim cvorovima, tipiziranim usmerenim vezama i svojstvima na oba.
3. **Zasto je Skill poseban cvor?** Jedna normalizovana vestina povezuje mnogo kandidata i poslova i omogucava agregacije/slicnost.
4. **Zasto HAS_SKILL ima svojstva?** Nivo i godine su svojstvo konkretnog odnosa kandidata prema vestini.
5. **Zasto REQUIRES_SKILL ima weight?** Razliciti zahtevi nisu jednako vazni za preporuku.
6. **Sta znaci mandatory?** Ako je obavezna vestina nedostajuca, oglas je podrazumevano nekvalifikovan.
7. **Da li je score AI verovatnoca?** Ne; to je transparentan procenat ponderisanog poklapanja.
8. **Kako se izbegava deljenje nulom?** Posao bez zahteva ima `totalWeight=0` i score 0.
9. **Kako je KNOWS modelovan?** Jedna kanonska veza za par ID-jeva, ali se cita neusmereno.
10. **Zasto ne dve KNOWS veze?** Duplirale bi podatke i otezele doslednost; jedna je dovoljna za simetricno poznanstvo.
11. **Sta radi unique constraint?** Garantuje jedinstven ID i pravi indeks za lookup.
12. **Koji su dodatni indeksi?** Imena kandidata/kompanija/vestina, email i slozeni active-created za poslove.
13. **Zasto slozeni indeks za posao?** Podrzava cesto filtriranje aktivnih i rad sa datumom kreiranja.
14. **Kako se sprecava injection?** Cypher tekst je stalan, a spoljne vrednosti su `$param`.
15. **Zasto ne Prisma?** Zelimo vidljive, objasnjive Cypher upite kroz zvanicni driver.
16. **Sta radi MERGE u seedu?** Pronalazi ili kreira isti obrazac, pa re-run ne dodaje duplikat veze.
17. **Da li je seed slucajan?** Deterministicki je, sa fiksiranim LCG seedom i poslovnim porodicama poslova.
18. **Kako seed cuva semantiku?** Frontend porodice cesce koriste frontend vestine, IT poslovi relevantne zahteve.
19. **Sta je transakcija ovde?** Kreiranje kandidata/posla i njegovih veza se izvrsava atomarno kroz `executeWrite`.
20. **Zasto zatvarati sesije?** Sprecava curenje konekcija i omogucava driver pool-u korektan rad.
21. **Sta je pattern matching?** Cypher pretraga oblika poput `(c)-[:HAS_SKILL]->(s)`.
22. **Sta je variable-length path?** Putanja sa promenljivim brojem veza, npr. `[:KNOWS*..6]`.
23. **Zasto postoji granica sest?** Stiti bazu i UI od eksplozije pretrage.
24. **Sta radi shortestPath?** Vraca putanju sa najmanjim brojem relacija izmedju dva polazna cvora.
25. **Sta su zajednicki kontakti?** Cvorovi koji su KNOWS povezani sa oba kandidata.
26. **Kako predlazemo kontakt?** Kandidat na dva hop-a koji jos nije direktan kontakt, rangiran brojem posrednika.
27. **Sta je Jaccard slicnost?** Velicina preseka skupova vestina podeljena velicinom njihove unije.
28. **Zasto Cypher alternativa Node Similarity?** Radi i bez GDS plugina, ali nije zamena za GDS skaliranje.
29. **Sta GDS projektuje?** Memorijski graf od Candidate cvorova i KNOWS veza.
30. **Zasto Louvain?** Nalazi zajednice na osnovu gustine veza i pogodan je za mreze poznanstava.
31. **Ogranicenje Louvain rezultata?** Zajednica je algoritamski signal, ne poslovna istina niti uzrok veze.
32. **Sta je EXPLAIN?** Prikazuje plan bez izvrsavanja.
33. **Sta je PROFILE?** Izvrsava upit i vraca stvarne statistike/planski operator.
34. **Koji operator trazimo za ID?** NodeIndexSeek ili ekvivalent preko unique constraint-a.
35. **Zasto agregacije mogu biti skuplje?** Moraju traversirati relevantne veze i grupisati rezultate.
36. **Kako merimo benchmark?** Skripta meri stvarni PROFILE poziv i zapisuje vreme, broj redova i plan.
37. **Zasto nema statickih ms u UI?** Zavise od hardvera/cache-a; lazna merenja nisu validna.
38. **Kako radi graf vizualizacija?** API vraca cvorove i veze ogranicenog podgrafa, Cytoscape omogucava zoom/pan/selekciju.
39. **Zasto nije slobodan Cypher editor?** Bio bi bezbednosni i operativni rizik; koristi se bela lista demonstracija.
40. **Sta ako Neo4j nije dostupan?** Driver mapira problem na jasnu 503 poruku sa korakom za Docker.
41. **Sta ako GDS nije dostupan?** Community endpoint prijavljuje nedostupnost, a slicnost ostaje Cypher algoritam.
42. **Kako se brise kandidat?** `DETACH DELETE` brise i incidentne veze; produkcija bi trazila arhivsku politiku.
43. **Zasto Location kao cvor?** Deli se izmedju kandidata, poslova i kompanija pa omogucava zajednicke traversale.
44. **Zasto Certification-VALIDATES_SKILL?** Razdvaja sertifikat od same vestine i cuva njegovo znacenje.
45. **Koja je glavna demonstracija projekta?** Objastiva preporuka zasnovana na graf relacijama, zatim putanje, analitika i stvarni PROFILE.
