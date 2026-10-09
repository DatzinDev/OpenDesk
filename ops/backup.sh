#!/bin/sh
# Respaldos de OpenDesk: base de datos (pg_dump) y adjuntos (volumen de SeaweedFS), con 14 días de retención.
# Uso: backup.sh        → espera y respalda todos los días a las 03:00 (hora de TZ)
#      backup.sh now    → respalda una vez y termina
set -eu
KEEP_DAYS=14

backup() {
  stamp=$(date +%Y%m%d-%H%M)
  pg_dump -h db -U opendesk -Fc opendesk > "/backups/db-$stamp.dump.tmp" && mv "/backups/db-$stamp.dump.tmp" "/backups/db-$stamp.dump"
  # ponytail: copia en caliente del volumen; para cero escrituras durante la copia, detener `storage` antes.
  tar czf "/backups/adjuntos-$stamp.tar.gz" -C /storage .
  find /backups -type f \( -name 'db-*.dump' -o -name 'adjuntos-*.tar.gz' \) -mtime +$((KEEP_DAYS - 1)) -delete
  echo "$(date -Iseconds) respaldo listo: db-$stamp.dump, adjuntos-$stamp.tar.gz"
}

if [ "${1:-}" = "now" ]; then backup; exit 0; fi
echo "Respaldos programados a las 03:00 ($TZ), conservando $KEEP_DAYS días."
while true; do
  if [ "$(date +%H%M)" = "0300" ]; then backup || echo "$(date -Iseconds) el respaldo falló"; sleep 60; fi
  sleep 30
done
