// app/api/telegram/configure/route.ts
import { NextResponse } from 'next/server';
import { notificationService } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { botToken, chatId } = await request.json();

    if (!botToken || !chatId) {
      return NextResponse.json(
        { error: 'Bot token and chat ID are required' },
        { status: 400 }
      );
    }

    // Проверяем, что токен рабочий
    const testUrl = `https://api.telegram.org/bot${botToken}/getMe`;
    const testResponse = await fetch(testUrl);
    const testData = await testResponse.json();

    if (!testData.ok) {
      return NextResponse.json(
        { error: 'Invalid bot token', details: testData.description },
        { status: 400 }
      );
    }

    // Сохраняем настройки
    const settings = notificationService.saveTelegramSettings(botToken, chatId);

    // Отправляем тестовое сообщение
    const testMessageUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    await fetch(testMessageUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: '✅ Telegram бот успешно подключен к Lifestyle Crimea! Теперь вы будете получать уведомления о новых бронированиях.',
        parse_mode: 'HTML',
      }),
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Telegram configured successfully',
      settings: {
        botToken: settings.botToken,
        chatId: settings.chatId,
      }
    });

  } catch (error) {
    console.error('Error configuring telegram:', error);
    return NextResponse.json(
      { error: 'Failed to configure telegram', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
