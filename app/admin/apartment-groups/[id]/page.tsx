'use client';

import { use, useEffect, useState } from 'react';
import GroupForm from '../GroupForm';

type ProximityType = 'adjacent' | 'same_floor' | 'stacked';

type GroupData = {
  id: string;
  title: string;
  proximity: ProximityType;
  building: number | null;
  note: string | null;
  sort: number;
  is_active: number;
  items: { group_id: string; apartment_id: string }[];
};

export default function EditApartmentGroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [group, setGroup] = useState<GroupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/apartment-groups/${id}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        if (!r.ok) throw new Error('fetch failed');
        return r.json();
      })
      .then((data) => { if (data) setGroup(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="admin-loading">Загрузка...</div>;
  if (notFound) return <div className="admin-page"><p>Связка не найдена.</p></div>;
  if (!group) return null;

  return <GroupForm initialData={group} />;
}
