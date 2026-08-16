'use client';

import { useEffect, useState } from 'react';
import TelegramSettings from '@/components/admin/TelegramSettings';

interface AdminUser {
  id: string;
  username: string;
  created_at: string;
}

interface LongTermTerm {
  id: string;
  months: number;
  label: string | null;
}

export default function SettingsPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');
  const [loadingAdd, setLoadingAdd] = useState(false);

  // Долгосрочная аренда
  const [minDays, setMinDays] = useState('30');
  const [savingMinDays, setSavingMinDays] = useState(false);
  const [minDaysMessage, setMinDaysMessage] = useState('');
  const [minDaysError, setMinDaysError] = useState('');

  // Сроки долгосрочной аренды
  const [terms, setTerms] = useState<LongTermTerm[]>([]);
  const [newTermMonths, setNewTermMonths] = useState('');
  const [newTermLabel, setNewTermLabel] = useState('');
  const [termError, setTermError] = useState('');
  const [savingTerm, setSavingTerm] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchSettings();
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    try {
      const res = await fetch('/api/admin/long-term-terms');
      if (res.ok) setTerms(await res.json());
    } catch {}
  };

  const handleAddTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    setTermError('');
    setSavingTerm(true);

    try {
      const res = await fetch('/api/admin/long-term-terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ months: Number(newTermMonths), label: newTermLabel }),
      });
      const data = await res.json() as { error?: string };

      if (res.ok) {
        setNewTermMonths('');
        setNewTermLabel('');
        fetchTerms();
      } else {
        setTermError(data.error ?? 'Ошибка');
      }
    } catch {
      setTermError('Ошибка сервера');
    } finally {
      setSavingTerm(false);
    }
  };

  const handleDeleteTerm = async (term: LongTermTerm) => {
    const name = term.label || `${term.months} мес`;
    if (!confirm(`Удалить срок «${name}»? Цены апартаментов под этот срок тоже удалятся.`)) return;

    try {
      const res = await fetch('/api/admin/long-term-terms', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: term.id }),
      });
      if (res.ok) fetchTerms();
      else alert('Не удалось удалить срок');
    } catch {
      alert('Ошибка сервера');
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setMinDays(String(data.long_term_min_days ?? 30));
      }
    } catch {}
  };

  const handleSaveMinDays = async () => {
    setSavingMinDays(true);
    setMinDaysMessage('');
    setMinDaysError('');

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ long_term_min_days: Number(minDays) }),
      });
      const data = await res.json() as { error?: string; long_term_min_days?: number };

      if (res.ok) {
        setMinDays(String(data.long_term_min_days ?? minDays));
        setMinDaysMessage('Сохранено');
        setTimeout(() => setMinDaysMessage(''), 3000);
      } else {
        setMinDaysError(data.error ?? 'Ошибка при сохранении');
      }
    } catch {
      setMinDaysError('Ошибка сервера');
    } finally {
      setSavingMinDays(false);
    }
  };

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
        <h2>Длительная аренда</h2>
        <div className="admin-form-card">
          <div className="form-group">
            <label>С какого срока аренда считается долгосрочной (суток)</label>
            <input
              type="number"
              min={1}
              max={365}
              value={minDays}
              onChange={e => setMinDays(e.target.value)}
              disabled={savingMinDays}
              style={{ maxWidth: 200 }}
            />
            <p className="settings-hint">
              Это число видит гость в форме заявки как минимальный срок.
            </p>
          </div>
          <button
            className="admin-button primary"
            onClick={handleSaveMinDays}
            disabled={savingMinDays}
          >
            {savingMinDays ? 'Сохранение...' : 'Сохранить'}
          </button>
          {minDaysError && <div className="error" style={{ marginTop: 8 }}>{minDaysError}</div>}
          {minDaysMessage && <div style={{ marginTop: 8, color: '#166534' }}>{minDaysMessage}</div>}

          <hr className="settings-divider" />

          <h3 className="settings-subtitle">Сроки аренды</h3>
          <p className="settings-hint" style={{ marginBottom: 12 }}>
            Из этих сроков собирается переключатель на сайте: гость жмёт «3 месяца» — и во всех
            карточках подставляется цена под этот срок. Саму цену вписываете в карточке каждого
            апартамента.
          </p>

          <div className="terms-list">
            {terms.length === 0 && <div className="settings-hint">Сроков пока нет</div>}
            {terms.map(term => (
              <div key={term.id} className="term-chip">
                <span className="term-chip__name">{term.label || `${term.months} мес`}</span>
                <span className="term-chip__months">{term.months} мес</span>
                <button
                  type="button"
                  className="term-chip__del"
                  onClick={() => handleDeleteTerm(term)}
                  aria-label={`Удалить срок ${term.label || term.months + ' мес'}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddTerm} className="settings-add-form" style={{ marginTop: 12 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <input
                type="number"
                min={1}
                max={60}
                placeholder="Месяцев"
                value={newTermMonths}
                onChange={e => setNewTermMonths(e.target.value)}
                disabled={savingTerm}
                required
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <input
                type="text"
                maxLength={40}
                placeholder="Подпись (необязательно): «Полгода»"
                value={newTermLabel}
                onChange={e => setNewTermLabel(e.target.value)}
                disabled={savingTerm}
              />
            </div>
            <button type="submit" className="admin-button primary" disabled={savingTerm}>
              {savingTerm ? 'Добавление...' : 'Добавить срок'}
            </button>
          </form>
          {termError && <div className="error" style={{ marginTop: 8 }}>{termError}</div>}
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

        .settings-hint {
          margin: 6px 0 0;
          font-size: 13px;
          line-height: 1.5;
          color: #64748b;
        }

        .settings-divider {
          border: none;
          border-top: 1px solid #e2e8f0;
          margin: 24px 0 16px;
        }

        .settings-subtitle {
          font-size: 15px;
          font-weight: 600;
          color: #1a2634;
          margin: 0 0 4px;
        }

        .terms-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .term-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px 8px 14px;
          background: #ecfeff;
          border: 1px solid #a5f3fc;
          border-radius: 999px;
        }

        .term-chip__name {
          font-size: 14px;
          font-weight: 600;
          color: #0e7490;
        }

        .term-chip__months {
          font-size: 12px;
          color: #64748b;
        }

        .term-chip__del {
          border: none;
          background: transparent;
          color: #94a3b8;
          cursor: pointer;
          font-size: 14px;
          line-height: 1;
          padding: 4px;
          border-radius: 50%;
        }

        .term-chip__del:hover {
          color: #dc2626;
          background: #fee2e2;
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
