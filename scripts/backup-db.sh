#!/bin/bash

# Настройки
BACKUP_DIR="/var/www/lovelifestyle/backups"
DB_PATH="/var/www/lovelifestyle/data.sqlite"
DATE=$(date +%Y%m%d_%H%M%S)
WEEKLY_DIR="$BACKUP_DIR/weekly"
DAILY_DIR="$BACKUP_DIR/daily"

# Создаем папки если нет
mkdir -p $WEEKLY_DIR $DAILY_DIR

# Ежедневный бэкап
cp $DB_PATH "$DAILY_DIR/data_$DATE.sqlite"
echo "✅ Ежедневный бэкап создан: data_$DATE.sqlite"

# Оставляем только последние 7 ежедневных бэкапов
cd $DAILY_DIR
ls -t | tail -n +8 | xargs -r rm
echo "🧹 Очищено старых ежедневных бэкапов"

# Еженедельный бэкап (каждое воскресенье)
if [ $(date +%u) -eq 7 ]; then
    cp $DB_PATH "$WEEKLY_DIR/weekly_$(date +%Y%m%d).sqlite"
    echo "✅ Еженедельный бэкап создан: weekly_$(date +%Y%m%d).sqlite"
    
    # Оставляем только последние 4 недельных бэкапа
    cd $WEEKLY_DIR
    ls -t | tail -n +5 | xargs -r rm
    echo "🧹 Очищено старых недельных бэкапов"
fi

# Сжимаем старые бэкапы (старше 3 дней)
find $DAILY_DIR -name "*.sqlite" -mtime +3 -exec gzip {} \;
echo "🗜️ Старые бэкапы сжаты"

# Логирование
echo "$(date): Backup completed" >> $BACKUP_DIR/backup.log