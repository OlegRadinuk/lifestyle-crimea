import { NextResponse } from 'next/server';
import { seasonTemplateService } from '@/lib/db';
import { checkAdminAuth } from '@/lib/admin-auth';

export async function GET(request: Request) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;
  return NextResponse.json(seasonTemplateService.getAll());
}

export async function POST(request: Request) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;
  try {
    const data = await request.json();
    const id = seasonTemplateService.upsert({
      id: data.id,
      name: data.name,
      date_from: data.date_from,
      date_to: data.date_to,
      sort_order: Number(data.sort_order ?? 0),
      parking_price: data.parking_price != null ? Number(data.parking_price) : null,
    });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error saving season template:', error);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;
  try {
    const { templateId } = await request.json();
    seasonTemplateService.delete(templateId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
