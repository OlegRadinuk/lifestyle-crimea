// app/api/telegram/send/route.ts
import { NextResponse } from 'next/server';
import { notificationService } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { message, bookingId, type, parseMode = 'HTML' } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Получаем настройки Telegram
    const settings = notificationService.getActiveTelegramSettings();
    
    if (!settings) {
      return NextResponse.json(
        { error: 'Telegram not configured. Please add bot token and chat ID first.' },
        { status: 400 }
      );
    }

    // Отправляем сообщение через Telegram API
    const telegramApiUrl = `https://api.telegram.org/bot${settings.bot_token}/sendMessage`;
    
    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: settings.chat_id,
        text: message,
        parse_mode: parseMode,
        disable_web_page_preview: true,
      }),
    });

    const telegramResponse = await response.json();

    if (!telegramResponse.ok) {
      throw new Error(telegramResponse.description || 'Telegram API error');
    }

    // Логируем успешную отправку
    notificationService.logNotification({
      bookingId,
      type: type || 'new_booking',
      status: 'sent',
    });

    return NextResponse.json({ 
      success: true,
      message: 'Notification sent successfully',
    });

  } catch (error) {
    console.error('Error sending telegram:', error);
    
    // Логируем ошибку
    notificationService.logNotification({
      bookingId: undefined,
      type: 'new_booking',
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to send notification', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
