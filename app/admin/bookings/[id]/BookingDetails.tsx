'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface BookingDetailsProps {
  booking: any; // Временно используем any
}

export default function BookingDetails({ booking }: BookingDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(booking.manager_notes || '');
  const [prepaidAmount, setPrepaidAmount] = useState(booking.prepaid_amount || 0);
  const [prepaidStatus, setPrepaidStatus] = useState(booking.prepaid_status || 'not_required');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'dd MMMM yyyy, HH:mm', { locale: ru });
    } catch {
      return dateStr;
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPrepaidStatusText = (status: string) => {
    const texts: Record<string, string> = {
      not_required: 'Не требуется',
      pending: 'Ожидает оплаты',
      paid: 'Оплачено',
      partially: 'Частично оплачено'
    };
    return texts[status] || status;
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manager_notes: notes,
          prepaid_amount: prepaidAmount,
          prepaid_status: prepaidStatus
        })
      });

      if (!response.ok) throw new Error('Failed to save');

      setMessage({ text: 'Сохранено!', type: 'success' });
      setIsEditing(false);
    } catch (error) {
      setMessage({ text: 'Ошибка при сохранении', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">
          Бронь #{booking.id.slice(0, 8)}
          <span className={`ml-4 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
            {booking.status === 'confirmed' ? 'Подтверждено' : 
             booking.status === 'cancelled' ? 'Отменено' : 
             booking.status === 'pending' ? 'Ожидание' : booking.status}
          </span>
        </h1>
        <div className="flex gap-2">
          <Link href="/admin/bookings" className="admin-button admin-button-secondary">
            ← Назад
          </Link>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Основная информация */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-medium mb-4">Информация о бронировании</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Апартаменты</div>
                  <div className="font-medium">{booking.apartment_title || 'Не указано'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Источник</div>
                  <div className="font-medium capitalize">{booking.source || 'website'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Заезд</div>
                  <div className="font-medium">{formatDate(booking.check_in)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Выезд</div>
                  <div className="font-medium">{formatDate(booking.check_out)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Гостей</div>
                  <div className="font-medium">{booking.guests_count} чел.</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Общая стоимость</div>
                  <div className="font-medium">{booking.total_price} ₽</div>
                </div>
              </div>

              {booking.external_id && (
                <div>
                  <div className="text-sm text-gray-500">ID во внешней системе</div>
                  <div className="font-mono text-sm">{booking.external_id}</div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
            <h2 className="text-lg font-medium mb-4">Информация о госте</h2>
            
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500">Имя</div>
                <div className="font-medium">{booking.guest_name}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Телефон</div>
                  <div className="font-medium">{booking.guest_phone}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Email</div>
                  <div className="font-medium">{booking.guest_email}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Боковая панель с заметками и оплатой */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Заметки менеджера</h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {isEditing ? 'Отмена' : 'Редактировать'}
              </button>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Введите заметки..."
                />
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full admin-button"
                >
                  {isSaving ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            ) : (
              <div className="text-gray-700 whitespace-pre-wrap min-h-[100px]">
                {notes || 'Нет заметок'}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
            <h2 className="text-lg font-medium mb-4">Предоплата</h2>
            
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Сумма</label>
                  <input
                    type="number"
                    value={prepaidAmount}
                    onChange={(e) => setPrepaidAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Статус</label>
                  <select
                    value={prepaidStatus}
                    onChange={(e) => setPrepaidStatus(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="not_required">Не требуется</option>
                    <option value="pending">Ожидает оплаты</option>
                    <option value="paid">Оплачено</option>
                    <option value="partially">Частично оплачено</option>
                  </select>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-2xl font-bold mb-2">{prepaidAmount} ₽</div>
                <div className="text-sm text-gray-600">
                  Статус: {getPrepaidStatusText(prepaidStatus)}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
            <h2 className="text-lg font-medium mb-4">Системная информация</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Создано:</span>
                <span className="ml-2">{formatDate(booking.created_at)}</span>
              </div>
              <div>
                <span className="text-gray-500">Обновлено:</span>
                <span className="ml-2">{formatDate(booking.updated_at)}</span>
              </div>
              <div>
                <span className="text-gray-500">ID:</span>
                <span className="ml-2 font-mono text-xs">{booking.id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}