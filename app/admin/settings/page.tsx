'use client';

import { useEffect, useState } from 'react';
import TelegramSettings from '@/components/admin/TelegramSettings';

interface AdminUser {
  id: string;
  username: string;
  created_at: string;
}

export default function SettingsPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');
  const [loadingAdd, setLoadingAdd] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) setUsers(await res.json());
    } catch {}
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');
    setUserSuccess('');
    setLoadingAdd(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, password: newPassword }),
      });
      const data = await res.json() as { error?: string };

      if (res.ok) {
        setUserSuccess('Пользователь добавлен');
        setNewUsername('');
        setNewPassword('');
        fetchUsers();
      } else {
        setUserError(data.error ?? 'Ошибка');
      }
    } catch {
      setUserError('Ошибка сервера');
    } finally {
      setLoadingAdd(false);
    }
  };

  const handleDelete = async (id: string, username: string) => {
    if (!confirm(`Удалить пользователя "${username}"?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      const data = await res.json() as { error?: string };

      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== id));
      } else {
        alert(data.error ?? 'Ошибка при удалении');
      }
    } catch {
      alert('Ошибка сервера');
    }
  };

  return (
    <div className="admin-page">
      <h1 className="admin-title">Настройки</h1>

      <div className="settings-section">
        <h2>Пользователи</h2>
        <div className="admin-form-card">
          <table className="admin-table" style={{ marginBottom: 24 }}>
            <thead>
              <tr>
                <th>Логин</th>
                <th>Создан</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{new Date(user.created_at).toLocaleDateString('ru-RU')}</td>
                  <td>
                    <button
                      className="admin-button small warning"
                      onClick={() => handleDelete(user.id, user.username)}
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 style={{ marginBottom: 12, fontSize: 15 }}>Добавить пользователя</h3>
          <form onSubmit={handleAddUser} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <input
                type="text"
                placeholder="Логин"
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                disabled={loadingAdd}
                style={{ minWidth: 160 }}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <input
                type="password"
                placeholder="Пароль"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                disabled={loadingAdd}
                style={{ minWidth: 160 }}
              />
            </div>
            <button type="submit" className="admin-button primary" disabled={loadingAdd}>
              {loadingAdd ? 'Добавление...' : 'Добавить'}
            </button>
          </form>
          {userError && <div className="error" style={{ marginTop: 8 }}>{userError}</div>}
          {userSuccess && <div style={{ marginTop: 8, color: '#166534' }}>{userSuccess}</div>}
        </div>
      </div>

      <div className="settings-section">
        <h2>Telegram уведомления</h2>
        <TelegramSettings />
      </div>

      <div className="settings-section">
        <h2>Общие настройки</h2>
        <div className="admin-form-card">
          <div className="form-group">
            <label>Название сайта</label>
            <input type="text" defaultValue="Life Style Crimea" />
          </div>
          <div className="form-group">
            <label>Email для уведомлений</label>
            <input type="email" defaultValue="admin@lovelifestyle.ru" />
          </div>
          <button className="admin-button primary">Сохранить</button>
        </div>
      </div>
    </div>
  );
}
