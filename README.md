# Servidor Deshidratadores Mikasa

## Install
```sh
clone https://github.com/pixal-lab/deshid-SV
cd deshid-SV
npm install
```

## DB usage

```sql
alter user postgres with password 'bdpw';
create database DESHIDRATADOR;
\c DESHIDRATADOR
\i database/database.sql
```
Use just the two last lines for update
## Start server
```sh
npm run dev
```
