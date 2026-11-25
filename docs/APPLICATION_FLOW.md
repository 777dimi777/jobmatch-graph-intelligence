# Tok prijave na posao

Prijava nije poseban red u relacionoj tabeli. U Neo4j modelu ona je veza izmedju kandidata i posla:

```text
(Candidate)-[:APPLIED_TO { id, status, appliedAt, coverNote }]->(Job)
```

## Kreiranje prijave

Kada kandidat klikne **Prijavi se**, frontend salje `POST /api/applications` sa ID-jem aktivnog kandidata i ID-jem posla. Backend pronalazi aktivan `Job` cvor i koristi `MERGE` za `APPLIED_TO` vezu.

- za novu prijavu postavlja `status = submitted` i vreme prijave;
- za vec postojecu vezu ne pravi duplikat, vec azurira vreme poslednje izmene;
- opcioni tekst prijave se trimuje i ogranicen je na 1.000 karaktera.

## Prikaz statusa u preporuci

Cypher upit za preporuke pored poklapanja vestina radi i opciono trazenje:

```text
(Candidate)-[application:APPLIED_TO]->(Job)
```

Ako veza postoji, rezultat vraca `applicationStatus`. UI tada prikazuje, na primer, **Prijava poslata** ili **Prijava u pregledu**, umesto novog dugmeta za prijavu.

## Poslovna vrednost graf modela

Ista veza odgovara na tri pitanja bez kopiranja podataka:

1. Da li je kandidat vec prijavljen na preporuceni posao?
2. Koje poslove je kandidat prijavio i kod kojih kompanija?
3. Koliko prijava ima odredjeni posao ili kompanija?

Zbog toga se prijava prirodno uklapa u Neo4j model i koristi istu strukturu koju koriste preporuke i analitika.
