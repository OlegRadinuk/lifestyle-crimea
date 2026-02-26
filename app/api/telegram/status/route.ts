// app/api/telegram/status/route.ts
import { NextResponse } from 'next/server';
import { notificationService } from '@/lib/db';

export async function GET() {
  try {
    const settings = notificationService.getActiveTelegramSettings();
    
    if (!settings) {
      return NextResponse.json({
        configured: false,
        message: 'Telegram not configured',
      });
    }

    // Проверяем, что бот активен
    const testUrl = `https://api.telegram.org/bot${settings.bot_token}/getMe`;
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
