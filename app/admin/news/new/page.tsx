'use client';

import Link from 'next/link';
import NewsForm from '../NewsForm';

export default function NewNewsPage() {
  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">Новая новость</h1>
        <Link href="/admin/news" className="admin-button">← Назад</Link>
      </div>
      <NewsForm />
    </div>
  );
}
