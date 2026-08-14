import { notificationService } from '@/lib/db';

type NotifyType = 'new_booking' | 'cancellation' | 'reminder' | 'long_term_request';

/**
 * Отправка уведомления менеджеру в Telegram — ТОЛЬКО с сервера.
 *
 * Раньше модалка бронирования дёргала /api/telegram/send прямо из браузера гостя.
 * После того как на этот эндпоинт повесили админ-авторизацию (14.04.2026), гость
 * получал 401, ошибка гасилась в catch — и заявки с сайта переставали доходить.
 * Здесь отправка идёт из серверного кода, поэтому авторизация не нужна, а гость
 * не может слать произвольные сообщения в чат.
 *
 * Никогда не бросает исключение: заявка уже сохранена, и падение уведомления
 * не должно ронять ответ гостю.
 */
export async function notifyTelegram(
  message: string,
  options: { bookingId?: string; type?: NotifyType } = {}
): Promise<boolean> {
  const { bookingId, type = 'new_booking' } = options;

  try {
    const settings = notificationService.getActiveTelegramSettings();

    if (!settings) {
      notificationService.logNotification({
        bookingId,
        type,
        status: 'failed',
        errorMessage: 'Telegram not configured',
      });
      return false;
    }

    const telegramBase = process.env.TELEGRAM_API_URL || 'https://api.telegram.org';
    const response = await fetch(`${telegramBase}/bot${settings.bot_token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: settings.chat_id,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const result = await response.json();

    notificationService.logNotification({
      bookingId,
      type,
      status: result.ok ? 'sent' : 'failed',
      errorMessage: result.ok ? undefined : (result.description || 'Telegram API error'),
    });

    return Boolean(result.ok);
  } catch (error) {
    console.error('Telegram notify failed:', error);
    notificationService.logNotification({
      bookingId,
      type,
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}
