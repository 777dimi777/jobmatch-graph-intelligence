# Kontrola kvaliteta

Ovaj dokument opisuje minimalnu proveru pre svakog smislenog Git commita. Cilj nije da se pravi commit samo zbog aktivnosti, vec da svaki commit ostavi projekat u proverljivom stanju.

## Brza provera frontenda i API-ja

```powershell
npm run lint
npx tsc --noEmit -p apps/web/tsconfig.json
```

Lint proverava pravila koda u NestJS i Next.js delovima. TypeScript provera posebno potvrđuje tipove klijentskih komponenti.

## Unit testovi

```powershell
npm test
```

Unit testovi ne zahtevaju Neo4j. Pokrivaju formulu za preporuku i politiku pretrage, ukljucujuci pravilo da prazan ili prekratak upit ne cita katalog iz baze.

## Neo4j integracioni testovi

Pre pokretanja ukljuciti Docker Desktop i bazu:

```powershell
docker compose up -d
$env:RUN_NEO4J_INTEGRATION='true'
npm test
```

Ovi testovi kreiraju, citaju, menjaju i brisu kandidata kroz stvarnu Neo4j vezu, kao i proveravaju rollback transakcije. Ako Docker daemon nije pokrenut, integracioni test namerno prijavljuje da Neo4j nije dostupan; to nije neuspeh unit testova.

## Rucna demonstracija

1. Otvoriti aplikaciju na `http://localhost:3000` ili lokalnoj IP adresi.
2. U globalnu pretragu uneti najmanje dva karaktera i otvoriti rezultat u brzom pregledu.
3. Otvoriti graf, izabrati cvor i proveriti modal sa osnovnim podacima.
4. Otvoriti preporuceni posao i kreirati prijavu.
5. Otvoriti obavestenja i proveriti da se relevantan posao oznacava kao procitan.
