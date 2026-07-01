import { NextRequest, NextResponse } from 'next/server';
import { CardService } from '@/services/card.service';
import { loadConfig } from '@/lib/config';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const config = loadConfig();
  const cardService = new CardService(config.dataDir);
  const card = cardService.getById(params.id);
  if (!card) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const body = cardService.getBody(params.id);
  return NextResponse.json({ card, body });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const config = loadConfig();
  const cardService = new CardService(config.dataDir);
  const input = await req.json();
  const updated = cardService.update(params.id, input);
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(updated);
}
