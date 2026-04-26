import { NextResponse } from 'next/server';
import { seasonTemplateService } from '@/lib/db';
import { checkAdminAuth } from '@/lib/admin-auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;
  const { id } = await params;
  return NextResponse.json(seasonTemplateService.getApartmentPrices(id));
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;
  const { id: apartmentId } = await params;
  try {
    const { templateId, price } = await request.json();
    if (!templateId || price === undefined || price === null) {
      return NextResponse.json({ error: 'templateId and price required' }, { status: 400 });
    }
    seasonTemplateService.setApartmentPrice(apartmentId, templateId, Number(price));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting apartment price:', error);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;
  const { id: apartmentId } = await params;
  try {
    const { templateId } = await request.json();
    seasonTemplateService.removeApartmentPrice(apartmentId, templateId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
