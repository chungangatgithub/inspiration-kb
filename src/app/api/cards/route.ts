import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import { CardService } from '@/services/card.service';
import { loadConfig } from '@/lib/config';
import { DeepSeekClient } from '@/services/deepseek.client';
import { runDigestionPipeline } from '@/services/digestion/pipeline';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const body = (formData.get('body') as string) || '';
  const userNote = (formData.get('userNote') as string) || null;
  const sourceUrl = (formData.get('sourceUrl') as string) || null;
  const files = formData.getAll('attachments') as File[];

  const config = loadConfig();
  const cardService = new CardService(config.dataDir);

  const attachments: { sourcePath: string; filename: string }[] = [];
  for (const file of files) {
    const tmpPath = `/tmp/insp-kb-${Date.now()}-${file.name}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(tmpPath, buffer);
    attachments.push({ sourcePath: tmpPath, filename: file.name });
  }

  const card = cardService.create({ body, userNote, sourceUrl, attachments });

  if (config.deepseekApiKey) {
    const client = new DeepSeekClient(config.deepseekApiKey);
    runDigestionPipeline(cardService, client, card.id).catch(console.error);
  }

  return NextResponse.json({ id: card.id, status: 'created' }, { status: 201 });
}
