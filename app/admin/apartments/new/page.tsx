'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewApartmentPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    short_description: '',
    description: '',
    max_guests: 2,
    area: '',
    price_base: 0,
    view: 'sea',
    has_terrace: false,
    features: [] as string[],
  });
  const [newFeature, setNewFeature] = useState('');

  const addFeature = () => {
    if (newFeature.trim()) {
      setForm({ ...form, features: [...form.features, newFeature.trim()] });
      setNewFeature('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/apartments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      router.push('/admin/apartments');
    }
  };

  return (
    <div className="admin-page">
      <h1>Новый апартамент</h1>
      <form onSubmit={handleSubmit}>
        {/* аналогично форме редактирования */}
        <button type="submit">Создать</button>
      </form>
    </div>
  );
}