#!/usr/bin/env bash
# Pencadangan basis data PostgreSQL Decant Temcy (T16).
#
# - pg_dump format custom (-Fc, sudah terkompresi), nama berisi tanggal: decant_temcy_YYYYmmdd_HHMMSS.dump
# - rotasi: hanya KEEP salinan terbaru yang disimpan (default 7), sisanya dihapus
# - kredensial dari variabel lingkungan, TIDAK ditulis di skrip ini
#
# Variabel (nama sama dengan backend/.env):
#   DB_HOST (default localhost)  DB_PORT (default 5432)  DB_USER  DB_PASSWORD  DB_NAME
#   BACKUP_DIR (default ./backups)   KEEP (default 7)
#   ENV_FILE (opsional): berkas berisi baris KEY=VALUE yang dibaca sebelum dump, mis. backend/.env
#
# Contoh pemakaian:
#   DB_USER=postgres DB_PASSWORD=... DB_NAME=decant_temcy ./scripts/backup_db.sh
#   ENV_FILE=backend/.env ./scripts/backup_db.sh
#
# Contoh cron (setiap hari 02:00, log ke berkas):
#   0 2 * * * cd /path/ke/parfum-decant-temcy && ENV_FILE=backend/.env ./scripts/backup_db.sh >> backups/backup.log 2>&1
#
# Restore (ke database KOSONG, jangan ke database yang sedang dipakai tanpa cadangan lain):
#   createdb -h localhost -U postgres decant_temcy_restore
#   pg_restore -h localhost -U postgres -d decant_temcy_restore --no-owner backups/decant_temcy_YYYYmmdd_HHMMSS.dump
#   (lewat pgAdmin: klik kanan database > Restore..., pilih berkas .dump, format Custom or tar)

set -euo pipefail

# Baca ENV_FILE (hanya baris KEY=VALUE sederhana; tidak dieksekusi sebagai shell)
if [[ -n "${ENV_FILE:-}" ]]; then
  [[ -f "$ENV_FILE" ]] || { echo "ENV_FILE tidak ditemukan: $ENV_FILE" >&2; exit 1; }
  while IFS='=' read -r key value; do
    [[ "$key" =~ ^(DB_HOST|DB_PORT|DB_USER|DB_PASSWORD|DB_NAME)$ ]] || continue
    value="${value%\"}"; value="${value#\"}"; value="${value%\'}"; value="${value#\'}"
    [[ -z "${!key:-}" ]] && export "$key=$value"
  done < "$ENV_FILE"
fi

: "${DB_USER:?DB_USER belum diset}"
: "${DB_NAME:?DB_NAME belum diset}"
: "${DB_PASSWORD:?DB_PASSWORD belum diset}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
KEEP="${KEEP:-7}"

command -v pg_dump >/dev/null || { echo "pg_dump tidak ditemukan (pasang postgresql-client)" >&2; exit 1; }
[[ "$KEEP" =~ ^[0-9]+$ && "$KEEP" -ge 1 ]] || { echo "KEEP harus bilangan bulat >= 1" >&2; exit 1; }

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d_%H%M%S)"
FILE="$BACKUP_DIR/decant_temcy_${STAMP}.dump"
TMP="$FILE.partial"

# Tulis ke berkas sementara dulu: dump yang gagal tidak menggantikan/menghapus cadangan lama
PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -Fc -f "$TMP" \
  || { rm -f "$TMP"; echo "pg_dump gagal, cadangan lama tidak diubah" >&2; exit 1; }
mv "$TMP" "$FILE"
echo "[$(date '+%F %T')] Cadangan dibuat: $FILE ($(du -h "$FILE" | cut -f1))"

# Rotasi: simpan KEEP terbaru, hapus yang lebih lama (hanya berkas dengan pola nama ini)
mapfile -t OLD < <(ls -1t "$BACKUP_DIR"/decant_temcy_*.dump 2>/dev/null | tail -n +"$((KEEP + 1))")
for f in "${OLD[@]:-}"; do
  [[ -n "$f" ]] || continue
  rm -f -- "$f" && echo "Cadangan lama dihapus: $f"
done
