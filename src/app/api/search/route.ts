import { NextRequest, NextResponse } from 'next/server';
import { CardService } from '@/services/card.service';
import { loadConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const config = loadConfig();
  const cardService = new CardService(config.dataDir);
  const q = req.nextUrl.searchParams.get('q') || '';
  const theme = req.nextUrl.searchParams.get('theme');
  const tag = req.nextUrl.searchParams.get('tag');
  const type = req.nextUrl.searchParams.get('type');

  let cards;
  if (q) {
    cards = cardService.search(q);
  } else if (theme) {
    cards = cardService.filterByTheme(theme);
  } else if (tag) {
    cards = cardService.filterByTag(tag);
  } else if (type) {
    cards = cardService.filterByType(type);
  } else {
    cards = cardService.listAll();
  }

  return NextResponse.json(cards);
}
