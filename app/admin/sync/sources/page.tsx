'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type IcsSource = {
  id: string;
  apartment_id: string;
  apartment_title: string;
  source_name: string;
  ics_url: string;
  is_active: number;
  last_sync: string | null;
  sync_status: string;
  error_message: string | null;
};

type Apartment = {
  id: string;
  title: string;
};

export default function IcsSourcesPage() {
  const [sources, setSources] = useState<IcsSource[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSource, setNewSource] = useState({
    apartment_id: '',
    source_name: 'travelline',
    ics_url: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sourcesRes, apartmentsRes] = await Promise.all([
        fetch('/api/admin/ics-sources'),
        fetch('/api/admin/apartments?simple=true')
      ]);
      
      const sourcesData = await sourcesRes.json();
      const apartmentsData = await apartmentsRes.json();
      
      setSources(sourcesData);
      setApartments(apartmentsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSource = async () => {
    try {
      const res = await fetch('/api/admin/ics-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSource),
      });
      
      if (res.ok) {
        setShowAddForm(false);
        setNewSource({ apartment_id: '', source_name: 'travelline', ics_url: '' });
        fetchData();
      }
    } catch (error) {
      console.error('Error adding source:', error);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await fetch(`/api/admin/ics-sources/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !current }),
      });
      fetchData();
    } catch (error) {
      console.error('Error toggling source:', error);
    }
  };

  const syncNow = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/ics-sources/${id}/sync`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (res.ok) {
        alert('Синхронизация запущена');
        fetchData();
      } else {
        const error = await res.json();
        alert('Ошибка: ' + error.error);
      }
    } catch (error) {
      console.error('Error syncing source:', error);
      alert('Ошибка при синхронизации');
    }
  };

  const copyIcsLink = (apartmentId: string) => {
    // Формируем ссылку для экспорта в Travelline
    const link = `https://lovelifestyle.ru/api/export/ics/${apartmentId}`;
    navigator.clipboard.writeText(link);
    alert('Ссылка скопирована');
  };

  if (loading) return <div className="admin-loading">Загрузка...</div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">ICS источники (Travelline)</h1>
        <button onClick={() => setShowAddForm(true)} className="admin-button primary">
          + Добавить источник
        </button>
      </div>

      {showAddForm && (
        <div className="admin-form-card">
          <h3>Новый ICS источник</h3>
          <div className="form-group">
            <label>Апартамент</label>
            <select
              value={newSource.apartment_id}
              onChange={(e) => setNewSource({ ...newSource, apartment_id: e.target.value })}
            >
              <option value="">Выберите апартамент</option>
              {apartments.map((apt) => (
                <option key={apt.id} value={apt.id}>{apt.title}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Название источника</label>
            <select
              value={newSource.source_name}
              onChange={(e) => setNewSource({ ...newSource, source_name: e.target.value })}
            >
              <option value="travelline">Travelline</option>
              <option value="yandex">Яндекс Путешествия</option>
              <option value="booking">Booking.com</option>
              <option value="sutochno">Суточно.ру</option>
            </select>
          </div>
          <div className="form-group">
            <label>ICS URL (из Travelline)</label>
            <input
              type="url"
              value={newSource.ics_url}
              onChange={(e) => setNewSource({ ...newSource, ics_url: e.target.value })}
              placeholder="https://api.travelline.ru/ical/v1/..."
            />
            <small className="form-hint">
              Скопируйте ссылку из Travelline: Календарь → Экспорт ICS
            </small>
          </div>
          <div className="form-actions">
            <button onClick={handleAddSource} className="admin-button primary">Сохранить</button>
            <button onClick={() => setShowAddForm(false)} className="admin-button">Отмена</button>
          </div>
        </div>
      )}

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Апартамент</th>
              <th>Источник</th>
              <th>Статус</th>
              <th>Последняя синх.</th>
              <th>Ошибка</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((source) => (
              <tr key={source.id}>
                <td>{source.apartment_title}</td>
                <td>
                  {source.source_name === 'travelline' ? 'Travelline' : source.source_name}
                </td>
                <td>
                  <span className={`status-badge ${source.is_active ? 'active' : 'inactive'}`}>
                    {source.is_active ? 'Активен' : 'Неактивен'}
                  </span>
                  <br />
                  <span className={`sync-status sync-${source.sync_status}`}>
                    {source.sync_status === 'success' ? '✓ успех' : 
                     source.sync_status === 'error' ? '✗ ошибка' : '⏳ ожидание'}
                  </span>
                </td>
                <td>{source.last_sync ? new Date(source.last_sync).toLocaleString('ru-RU') : 'никогда'}</td>
                <td className="error-message">{source.error_message || '-'}</td>
                <td className="actions">
                  <button onClick={() => syncNow(source.id)} className="admin-button small">
                    Синхр.
                  </button>
                  <button
                    onClick={() => copyIcsLink(source.apartment_id)}
                    className="admin-button small"
                    title="Скопировать ссылку для Travelline"
                  >
                    🔗 ICS
                  </button>
                  <button
                    onClick={() => toggleActive(source.id, !!source.is_active)}
                    className="admin-button small warning"
                  >
                    {source.is_active ? 'Выкл' : 'Вкл'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}