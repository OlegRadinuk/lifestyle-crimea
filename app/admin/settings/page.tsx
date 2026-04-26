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
          {/* Десктоп: таблица */}
          <table className="admin-table settings-users-table" style={{ marginBottom: 24 }}>
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

          {/* Мобиль: карточки */}
          <div className="settings-users-cards">
            {users.map(user => (
              <div key={user.id} className="settings-user-row">
                <div className="settings-user-info">
                  <span className="settings-user-name">{user.username}</span>
                  <span className="settings-user-date">{new Date(user.created_at).toLocaleDateString('ru-RU')}</span>
                </div>
                <button
                  className="admin-button small warning"
                  onClick={() => handleDelete(user.id, user.username)}
                >
                  Удалить
                </button>
              </div>
            ))}
          </div>

          <h3 style={{ marginBottom: 12, fontSize: 15 }}>Добавить пользователя</h3>
          <form onSubmit={handleAddUser} className="settings-add-form">
            <div className="form-group" style={{ margin: 0 }}>
              <input
                type="text"
                placeholder="Логин"
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                disabled={loadingAdd}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <input
                type="password"
                placeholder="Пароль"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                disabled={loadingAdd}
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

      <style jsx>{`
        .settings-section {
          margin-bottom: 32px;
        }

        .settings-section h2 {
          font-size: 18px;
          font-weight: 600;
          color: #1a2634;
          margin-bottom: 12px;
        }

        .settings-add-form {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: flex-end;
        }

        .settings-add-form .form-group input {
          min-width: 160px;
        }

        /* Мобиль: карточки вместо таблицы */
        .settings-users-cards { display: none; }

        @media (max-width: 768px) {
          .settings-users-table { display: none; }

          .settings-users-cards {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 24px;
          }

          .settings-user-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px 14px;
            gap: 10px;
          }

          .settings-user-info {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .settings-user-name {
            font-weight: 600;
            font-size: 14px;
            color: #1a2634;
          }

          .settings-user-date {
            font-size: 12px;
            color: #94a3b8;
          }

          .settings-add-form {
            flex-direction: column;
          }

          .settings-add-form .form-group {
            width: 100%;
          }

          .settings-add-form .form-group input {
            min-width: unset;
            width: 100%;
          }

          .settings-add-form .admin-button.primary {
            width: 100%;
            padding: 10px;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
