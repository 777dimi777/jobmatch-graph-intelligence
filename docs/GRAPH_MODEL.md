# Graf model

Svaki entitet ima jedinstveni `id`; constraints su u `apps/api/src/database/schema.ts`. Cvorovi su `Candidate`, `Skill`, `Job`, `Company`, `Location`, `Industry`, `Certification` i `Notification`.

| Cvor | Vazna svojstva | Poslovna namena |
| --- | --- | --- |
| Candidate | name, email, title, experienceYears | osoba koja trazi ili prati karijeru |
| Skill | name, category | normalizovana vestina za uporedjivanje |
| Job | title, level, salaryMin/Max, workMode, active | oglas koji se rangira |
| Company | name, website, size | poslodavac i deo mreze |
| Location | name, country | zajednicka lokacija za filtere |
| Industry | name | privredna oblast kompanije |
| Certification | name, issuer | dokaz kvalifikacije |
| Notification | id, type, title, message, read, createdAt, jobId | obavestenje o poslu relevantnom za kandidata |

| Veza, smer | Svojstva | Zasto postoji |
| --- | --- | --- |
| Candidate `-[:HAS_SKILL]->` Skill | level, yearsOfExperience | preporuka poredi nivo sa zahtevom |
| Job `-[:REQUIRES_SKILL]->` Skill | mandatory, weight, minLevel | objasnivo ponderisano rangiranje |
| Job `-[:POSTED_BY]->` Company | - | poslovi kompanije |
| Candidate `-[:KNOWS]->` Candidate | since, strength | profesionalna mreza i putanje |
| Candidate `-[:WORKS_AT]->` Company | role, since | putanja do zaposlenog u kompaniji |
| Candidate `-[:FOLLOWS]->` Company | - | interesovanje bez zaposlenja |
| Candidate/Job/Company `-[:LOCATED_IN]->` Location | - | lokalni filteri |
| Company `-[:BELONGS_TO]->` Industry | - | analitika po industriji |
| Candidate `-[:HAS_CERTIFICATION]->` Certification | - | kvalifikacija kandidata |
| Certification `-[:VALIDATES_SKILL]->` Skill | - | semanticki dokaz vestine |
| Skill `-[:RELATED_TO]->` Skill | similarity | srodne tehnologije |
| Candidate `-[:APPLIED_TO]->` Job | status, appliedAt | istorija prijava |
| Candidate `-[:RECEIVES]->` Notification | - | relevantna obavestenja izvedena iz kandidata, vestina i aktivnih poslova |

`KNOWS` je kanonska, jedna veza izmedju dva ID-ja: generator stvara samo `sourceId < targetId`; pretrage je citaju neusmereno sa `-[:KNOWS]-`. Time nema duplog zapisa za isto poznanstvo. Za ostale veze `MERGE` cini seed idempotentnim i sprecava paralelne duplikate.

Brisanje kandidata eksplicitno koristi `DETACH DELETE`; za produkciju bi prethodila poslovna odluka o arhivi prijava. Izabrani smerovi polaze od glavnog pitanja upita: od kandidata ka posedovanoj vestini i od posla ka potrebnoj vestini.

`Notification` nije fiktivna UI poruka: pri ucitavanju obavestenja sistem pronalazi aktivne poslove koji dele vestine sa kandidatom, zatim kreira ili ponovo koristi jedinstveni `Notification` cvor i povezuje ga vezom `RECEIVES`. Klik na obavestenje oznacava cvor kao procitan i otvara povezani posao.
