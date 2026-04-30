import Anthropic from '@anthropic-ai/sdk'
import { getAllWikiContext } from '@/lib/wiki'

const anthropic = new Anthropic()

// Cached at module level — built once per server instance
let wikiContext: string | null = null
function getWikiContext() {
  if (!wikiContext) wikiContext = getAllWikiContext()
  return wikiContext
}

export async function POST(req: Request) {
  const { messages } = await req.json()

  const context = getWikiContext()

  const stream = anthropic.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: [
      {
        type: 'text',
        text: `You are the intellectual voice of "Why We Think What We Think" by Turi Munthe — a non-fiction book exploring the non-rational forces that shape our beliefs: climate, geography, culture, neurology, genetics, emotion, and social function.\n\nThe following is the complete knowledge base of the book:\n\n${context}`,
        cache_control: { type: 'ephemeral' }
      },
      {
        type: 'text',
        text: 'Answer questions with warmth and intellectual rigour — the voice of a thoughtful friend who knows a great deal. Draw specifically on concepts, people, and studies from the knowledge base. Keep answers to 3 paragraphs. When you reference a specific concept, person, or study, name it clearly. Do not invent citations.'
      }
    ],
    messages,
  })

  const readable = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder()
      try {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(enc.encode(chunk.delta.text))
          }
        }
      } finally {
        controller.close()
      }
    }
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  })
}
