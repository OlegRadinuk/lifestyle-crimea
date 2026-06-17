'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ServiceForm, { type ServiceCategory } from '../ServiceForm';

function NewServiceInner() {
  const params = useSearchParams();
  const cat = params.get('category');
  const valid: ServiceCategory[] = ['apartment', 'service', 'infrastructure'];
  const category = (cat && valid.includes(cat as ServiceCategory) ? cat : 'apartment') as ServiceCategory;
  return <ServiceForm initial={{ category }} />;
}

export default function NewServicePage() {
  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">Новый пункт услуг</h1>
        <Link href="/admin/services" className="admin-button">← Назад</Link>
      </div>
      <Suspense fallback={<div className="admin-loading">Загрузка...</div>}>
        <NewServiceInner />
      </Suspense>
    </div>
  );
}
