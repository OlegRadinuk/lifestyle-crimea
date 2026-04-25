import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import { checkAdminAuth } from '@/lib/admin-auth';

export async function GET(request: Request) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;
  const { searchParams } = new URL(request.url);
  const lines = parseInt(searchParams.get('lines') || '50');
  const source = searchParams.get('source') || 'travelline';

  try {
    const dbLogs = db.prepare(`
      SELECT * FROM sync_logs
      WHERE source_name = ?
      ORDER BY created_at DESC
      LIMIT 20
    `).all(source);

    const logPath = path.join(process.cwd(), 'logs', 'travelline-cron.log');
    let fileLogs: string[] = [];
    try {
      if (fs.existsSync(logPath)) {
        const fileContent = fs.readFileSync(logPath, 'utf8');
        fileLogs = fileContent.split('\n').filter(line => line.trim()).slice(-lines);
      }
    } catch (e) {
      console.error('Error reading log file:', e);
    }

    const stats = {
      total:         (db.prepare('SELECT COUNT(*) as count FROM sync_logs WHERE source_name = ?').get(source) as { count: number }).count,
      successful:    (db.prepare("SELECT COUNT(*) as count FROM sync_logs WHERE source_name = ? AND status = 'success'").get(source) as { count: number }).count,
      failed:        (db.prepare("SELECT COUNT(*) as count FROM sync_logs WHERE source_name = ? AND status = 'error'").get(source) as { count: number }).count,
      lastSync:      (db.prepare('SELECT created_at FROM sync_logs WHERE source_name = ? ORDER BY created_at DESC LIMIT 1').get(source) as { created_at: string } | undefined)?.created_at ?? null,
      blockedFuture: (db.prepare("SELECT COUNT(*) as count FROM blocked_dates WHERE start_date > date('now')").get() as { count: number }).count,
    };

    return NextResponse.json({ dbLogs, fileLogs, stats });
  } catch (error) {
    console.error('Error fetching sync logs:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}
