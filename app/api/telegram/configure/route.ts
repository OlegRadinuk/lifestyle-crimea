// app/api/telegram/configure/route.ts
import { NextResponse } from 'next/server';
import { notificationService } from '@/lib/db';
import { checkAdminAuth } from '@/lib/admin-auth';

export async function POST(request: Request) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  try {
    const { botToken, chatId } = await request.json();

    if (!botToken || !chatId) {
      return NextResponse.json(
        { error: 'Bot token and chat ID are required' },
        { status: 400 }
      );
    }

    // Проверяем, что токен рабочий
    const telegramBase = process.env.TELEGRAM_API_URL || 'https://api.telegram.org';
    const testUrl = `${telegramBase}/bot${botToken}/getMe`;
    const testResponse = await fetch(testUrl);
    const testData = await testResponse.json();

    if (!testData.ok) {
      return NextResponse.json(
        { error: 'Invalid bot token', details: testData.description },
        { status: 400 }
      );
    }

    /* Сначала проверяем доставку, только потом сохраняем.
       Раньше результат тестовой отправки не читался вовсе: администратор
       видел «успешно подключен», а сообщение никуда не уходило. Для группы
       это особенно больно — самые частые причины именно там: бота забыли
       добавить в группу или у него нет права писать. */
    const testMessageUrl = `${telegramBase}/bot${botToken}/sendMessage`;
    const sendResponse = await fetch(testMessageUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: '✅ Бот подключён. Сюда будут приходить заявки с сайта «Стиль Жизни».',
        parse_mode: 'HTML',
      }),
    });
    const sendResult = await sendResponse.json();

    if (!sendResult.ok) {
      const d: string = sendResult.description || '';
      let hint = 'Проверьте Chat ID.';
      if (/chat not found/i.test(d)) {
        hint = 'Чат не найден. Если это группа — добавьте бота в неё, напишите там любое сообщение и нажмите «Найти чаты».';
      } else if (/bot was kicked|not a member/i.test(d)) {
        hint = 'Бота удалили из этой группы — добавьте его обратно.';
      } else if (/not enough rights|have no rights/i.test(d)) {
        hint = 'У бота нет права писать в этой группе. Разрешите ему отправку сообщений.';
      } else if (/blocked/i.test(d)) {
        hint = 'Пользователь заблокировал бота. Откройте чат с ботом и нажмите «Запустить».';
      }
      return NextResponse.json(
        { error: 'Сообщение не доставлено', details: d, hint },
        { status: 400 }
      );
    }

    // Сохраняем только после подтверждённой доставки
    const settings = notificationService.saveTelegramSettings(botToken, chatId);
    const chat = sendResult.result?.chat;

    return NextResponse.json({
      success: true,
      message: 'Telegram configured successfully',
      chat: chat
        ? { id: String(chat.id), type: chat.type, title: chat.title || chat.first_name }
        : undefined,
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
