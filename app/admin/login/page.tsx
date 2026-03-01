'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Простая проверка (потом заменишь на нормальную)
    if (password === 'admin123') {
      // Устанавливаем куку или localStorage
      localStorage.setItem('admin_auth', 'true');
      router.push('/admin');
    } else {
      setError('Неверный пароль');
    }
  };

  return (
    <div className="admin-login">
      <div className="login-card">
        <h1>Вход в админ-панель</h1>
        <form onSubmit={handleLogin}>
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <div className="error">{error}</div>}
          <button type="submit">Войти</button>
        </form>
      </div>
    </div>
  );
}