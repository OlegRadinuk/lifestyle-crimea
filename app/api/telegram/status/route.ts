// app/api/telegram/status/route.ts
import { NextResponse } from 'next/server';
import { notificationService } from '@/lib/db';
import { checkAdminAuth } from '@/lib/admin-auth';

export async function GET(request: Request) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;
  try {
    const settings = notificationService.getActiveTelegramSettings();
    
    if (!settings) {
      return NextResponse.json({
        configured: false,
        message: 'Telegram not configured',
      });
    }

    // Проверяем, что бот активен
    const telegramBase = process.env.TELEGRAM_API_URL || 'https://api.telegram.org';
    const testUrl = `${telegramBase}/bot${settings.bot_token}/getMe`;
    const response = await fetch(testUrl);
    const data = await response.json();

    // Получаем статистику уведомлений за последние 7 дней
    const stats = notificationService.getNotificationStats(7);

    return NextResponse.json({
      configured: true,
      active: data.ok,
      botInfo: data.ok ? data.result : null,
      chatId: settings.chat_id,
      stats,
    });

  } catch (error) {
    console.error('Error checking telegram status:', error);
    return NextResponse.json(
      { error: 'Failed to check telegram status' },
      { status: 500 }
    );
  }
}
