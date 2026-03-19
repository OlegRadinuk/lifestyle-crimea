#!/bin/bash

# scripts/run-travelline.sh

LOCKFILE="/tmp/travelline-sync.lock"
LOGFILE="/var/www/lovelifestyle/logs/travelline-cron.log"

# Проверяем, не запущен ли уже скрипт
if [ -e ${LOCKFILE} ] && kill -0 `cat ${LOCKFILE}` 2>/dev/null; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') ⚠️  Скрипт уже выполняется, пропускаем" >> ${LOGFILE}
    exit 1
fi

# Создаем lock-файл
echo $$ > ${LOCKFILE}

# Запускаем синхронизацию
echo "$(date '+%Y-%m-%d %H:%M:%S') 🚀 Запуск синхронизации..." >> ${LOGFILE}
cd /var/www/lovelifestyle

# Используем flock для надёжности
flock -n ${LOCKFILE} /usr/bin/node scripts/sync-travelline.js >> ${LOGFILE} 2>&1

# Удаляем lock-файл
rm -f ${LOCKFILE}

echo "$(date '+%Y-%m-%d %H:%M:%S') ✅ Синхронизация завершена" >> ${LOGFILE}