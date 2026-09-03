import { NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin-auth';
import { notificationService } from '@/lib/db';

/**
 * Список чатов, которые бот уже видел, — чтобы не искать chat_id руками.
 *
 * Отправлять уведомления в группу бот умел всегда: sendMessage одинаков и для
 * личного чата, и для группы, разница только в chat_id (у групп он
 * отрицательный). Вся сложность была в том, чтобы этот id узнать: раньше
 * пришлось бы идти к стороннему боту или дёргать getUpdates руками.
 *
 * Здесь getUpdates разбирается на сервере. Достаём чаты из всех типов
 * апдейтов, а не только из message: когда бота ДОБАВЛЯЮТ в группу, Telegram
 * шлёт my_chat_member — этого достаточно, чтобы узнать группу, даже если
 * бот из-за режима приватности не видит обычные сообщения.
 */

type TgChat = { id: number; type: string; title?: string; username?: string; first_name?: string };

export async function GET(request: Request) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  const url = new URL(request.url);
  const tokenFromQuery = url.searchParams.get('botToken');
  const botToken = tokenFromQuery || notificationService.getActiveTelegramSettings()?.bot_token;

  if (!botToken) {
    return NextResponse.json(
      { error: 'Сначала укажите токен бота' },
      { status: 400 }
    );
  }

  const base = process.env.TELEGRAM_API_URL || 'https://api.telegram.org';

  try {
    /* Telegram хранит апдейты около суток. Если бота добавили в группу
       давно и с тех пор в ней ничего не происходило, чат сюда не попадёт —
       на этот случай в ответе есть подсказка для интерфейса. */
    const res = await fetch(`${base}/bot${botToken}/getUpdates?limit=100&timeout=0`, {
      cache: 'no-store',
    });
    const data = await res.json();

    if (!data.ok) {
      return NextResponse.json(
        { error: 'Telegram отклонил запрос', details: data.description },
        { status: 400 }
      );
    }

    const seen = new Map<number, TgChat>();
    for (const update of data.result ?? []) {
      const chat: TgChat | undefined =
        update.message?.chat ??
        update.edited_message?.chat ??
        update.channel_post?.chat ??
        update.my_chat_member?.chat ??
        update.chat_member?.chat;
      if (chat?.id && !seen.has(chat.id)) seen.set(chat.id, chat);
    }

    const chats = [...seen.values()].map((c) => ({
      id: String(c.id),
      type: c.type,
      title: c.title || [c.first_name, c.username && `@${c.username}`].filter(Boolean).join(' ') || String(c.id),
      isGroup: c.type === 'group' || c.type === 'supergroup',
    }));

    /* Группы наверх: ради них всё и затевалось. */
    chats.sort((a, b) => Number(b.isGroup) - Number(a.isGroup));

    return NextResponse.json({
      chats,
      hint: chats.length
        ? undefined
        : 'Чатов не видно. Добавьте бота в группу и напишите там любое сообщение, затем нажмите «Найти чаты» ещё раз.',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Не удалось получить список чатов', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
