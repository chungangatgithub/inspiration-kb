import { DeepSeekClient } from "../deepseek.client";
import { CardService } from "../card.service";
import { classify } from "./steps/classify";
import { extractMeta } from "./steps/extract-meta";
import { tag } from "./steps/tag";
import { theme } from "./steps/theme";
import { summarize } from "./steps/summarize";
import { connect } from "./steps/connect";
import type { Connection } from "@/types/card";

export async function runDigestionPipeline(
  cardService: CardService,
  client: DeepSeekClient,
  cardId: string,
): Promise<void> {
  const card = cardService.getById(cardId);
  if (!card) return;

  let partial = false;

  // Mark as processing
  cardService.update(cardId, { digestionStatus: "processing" });

  const body = cardService.getBody(cardId);

  // Step 1: Classify
  let sourceType: string | null = null;
  try {
    const result = await classify(client, { body, userNote: card.user_note });
    if (result) {
      sourceType = result;
      cardService.update(cardId, { sourceType: result });
    } else {
      partial = true;
    }
  } catch {
    partial = true;
  }

  // Step 2: Extract metadata
  try {
    const metaResult = await extractMeta(client, {
      body,
      type: sourceType ?? "unknown",
    });
    if (metaResult) {
      cardService.update(cardId, {
        sourceTitle: metaResult.title,
        sourceMeta: metaResult.meta,
      });
    } else {
      partial = true;
    }
  } catch {
    partial = true;
  }

	  // Step 3: Tag
	  try {
	    const tags = await tag(client, { body, type: sourceType ?? "unknown" });
	    if (tags.length === 0) {
	      partial = true;
	    }
	    cardService.update(cardId, { aiTags: tags });
	  } catch {
	    partial = true;
	  }

	  // Step 4: Theme
	  try {
	    const allCards = cardService.listAll();
	    const existingThemes = Array.from(
	      new Set(allCards.flatMap(c => c.ai_themes)),
	    );
	    const themes = await theme(client, { body, existingThemes });
	    if (themes.length === 0) {
	      partial = true;
	    }
	    cardService.update(cardId, { aiThemes: themes });
	  } catch {
	    partial = true;
	  }

	  // Step 5: Summarize
	  try {
	    const summary = await summarize(client, { body });
	    if (!summary) {
	      partial = true;
	    }
	    cardService.update(cardId, { aiSummary: summary });
	  } catch {
	    partial = true;
	  }

  // Step 6: Connect
  try {
    const allCards = cardService.listAll();
    // Use the latest card data after all previous updates
    const updatedCard = cardService.getById(cardId);
    const currentSummary = updatedCard?.ai_summary ?? "";
    const currentTags = updatedCard?.ai_tags ?? [];

    const existingCardSummaries = allCards
      .filter(c => c.id !== cardId && c.ai_summary)
      .map(c => ({
        id: c.id,
        summary: c.ai_summary!,
        tags: c.ai_tags,
      }));

    if (existingCardSummaries.length > 0 && currentSummary) {
      const connections = await connect(client, {
        summary: currentSummary,
        tags: currentTags,
        existingCards: existingCardSummaries,
      });

      const typedConnections: Connection[] = connections.map(c => ({
        cardId: c.cardId,
        reason: c.reason,
        source: "ai" as const,
      }));

      cardService.update(cardId, { connections: typedConnections });
    }
  } catch {
    partial = true;
  }

  // Final status
  cardService.update(cardId, {
    digestionStatus: partial ? "partial" : "done",
  });
}
