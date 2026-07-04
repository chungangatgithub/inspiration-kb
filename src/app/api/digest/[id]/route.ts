import { NextRequest, NextResponse } from 'next/server';


import { getCardService } from '@/services/singleton';
import { loadConfig } from '@/lib/config';
import { DeepSeekClient } from '@/services/deepseek.client';
import { runDigestionPipeline } from '@/services/digestion/pipeline';

export const dynamic = 'force-dynamic';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const config = loadConfig();
  if (!config.deepseekApiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 400 });
  }
  const cardService = getCardService(config.dataDir);
  const card = cardService.getById(params.id);
  if (!card) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const client = new DeepSeekClient(config.deepseekApiKey);
  runDigestionPipeline(cardService, client, params.id).catch(console.error);

  return NextResponse.json({ status: 'digestion started' }, { status: 202 });
}
