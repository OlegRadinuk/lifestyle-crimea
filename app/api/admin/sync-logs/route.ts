import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lines = parseInt(searchParams.get('lines') || '50');
  const source = searchParams.get('source') || 'travelline';

  try {
    // 1. Получаем логи из БД (sync_log)
    const dbLogs = db.prepare(`
      SELECT * FROM sync_log 
      WHERE source = ? 
      ORDER BY last_sync DESC 
      LIMIT 20
    `).all(source);

    // 2. Читаем последние строки из файла лога
    const logPath = path.join(process.cwd(), 'logs', 'travelline-cron.log');
    let fileLogs: string[] = [];

    try {
      if (fs.existsSync(logPath)) {
        const fileContent = fs.readFileSync(logPath, 'utf8');
        fileLogs = fileContent
          .split('\n')
          .filter(line => line.trim())
          .slice(-lines);
      }
    } catch (e) {
      console.error('Error reading log file:', e);
    }

    // 3. Статистика
    const stats = {
      totalSyncs: db.prepare('SELECT COUNT(*) as count FROM sync_log WHERE source = ?').get(source) as { count: number },
      successful: db.prepare('SELECT COUNT(*) as count FROM sync_log WHERE source = ? AND status = "success"').get(source) as { count: number },
      failed: db.prepare('SELECT COUNT(*) as count FROM sync_log WHERE source = ? AND status = "error"').get(source) as { count: number },
      lastSync: db.prepare('SELECT last_sync FROM sync_log WHERE source = ? ORDER BY last_sync DESC LIMIT 1').get(source) as { last_sync: string } | undefined,
    };

    // 4. Считаем заблокированные даты
    const blockedCount = db.prepare(`
      SELECT COUNT(*) as count FROM blocked_dates 
      WHERE source = ? AND end_date >= date('now')
    `).get(source) as { count: number };

    return NextResponse.json({
      dbLogs,
      fileLogs,
      stats: {
        total: stats.totalSyncs?.count || 0,
        successful: stats.successful?.count || 0,
        failed: stats.failed?.count || 0,
        lastSync: stats.lastSync?.last_sync || null,
        blockedFuture: blockedCount.count
      }
    });
  } catch (error) {
    console.error('Error fetching sync logs:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}