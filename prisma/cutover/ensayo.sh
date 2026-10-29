#!/usr/bin/env bash
# Ensayo (o corte) de la base: copia prod -> base nueva en el Postgres del clon, aplica 00..04 y compara conteos.
# Uso (en la VPS de Dokploy): ./ensayo.sh <nombre_base_destino>   p.ej. codecontrol_ensayo
# Requiere ~/cc-ensayo/prod.url (cadena de conexión de prod, modo 600) y los .sql de este directorio en ~/cc-ensayo/sql/.
set -euo pipefail
DEST="${1:?falta el nombre de la base destino}"
W=~/cc-ensayo; SQL=$W/sql; PROD=$(cat $W/prod.url)
DB=$(docker ps -q -f name=codecontrol-db-raswhx | head -1)
PSQL() { docker exec -i "$DB" psql -U codecontrol -v ON_ERROR_STOP=1 "$@"; }
t0=$(date +%s); step() { echo "[$(( $(date +%s) - t0 ))s] $*"; }

step "1/7 dump de prod (solo esquema public) y auth.users"
docker run --rm -i postgres:15 pg_dump "$PROD" -Fc -n public --no-owner --no-privileges > $W/prod.dump
docker run --rm -i postgres:15 psql "$PROD" -c "\copy (select id,email,phone,encrypted_password,email_confirmed_at,last_sign_in_at,raw_user_meta_data from auth.users) to stdout with csv" > $W/auth_users.csv
ls -la $W/prod.dump $W/auth_users.csv | awk '{print $5, $9}'

step "2/7 base destino $DEST (se recrea) y andamios"
PSQL -d postgres -c "DROP DATABASE IF EXISTS $DEST" -c "CREATE DATABASE $DEST"
PSQL -d $DEST < $SQL/00-stubs.sql
step "3/7 carga de auth.users (hashes) y restore"
PSQL -d $DEST -c "\copy public._import_auth_users from stdin with csv" < $W/auth_users.csv
PSQL -d $DEST -c "insert into auth.users(id) select id from public._import_auth_users"
docker exec -i "$DB" pg_restore -U codecontrol -d $DEST --no-owner --no-privileges --exit-on-error < $W/prod.dump 2>&1 | tail -5 || true
step "4/7 scripts 01 a 04"
PSQL -d $DEST < $SQL/01-auth-columns.sql
PSQL -d $DEST < $SQL/02-supabase-to-standalone.sql
PSQL -d $DEST -v base='https://cc-s3.31.97.42.82.sslip.io' < $SQL/03-storage-urls.sql
PSQL -d $DEST < $SQL/04-fix-auth-references.sql
step "5/7 conteos por tabla en la base nueva"
PSQL -d $DEST -tA -F: -c "select table_name, (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from public.%I', table_name), false, true, '')))[1]::text::int from information_schema.tables where table_schema='public' and table_type='BASE TABLE' order by 1" > $W/conteos_$DEST.txt
wc -l < $W/conteos_$DEST.txt
step "6/7 perfiles con y sin clave"
PSQL -d $DEST -tA -c "select count(*), count(password_hash), count(*) filter (where password_hash is null) from profile"
step "7/7 listo"
