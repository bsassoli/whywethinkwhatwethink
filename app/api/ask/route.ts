import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()
const BOOK_FILE_ID = process.env.BOOK_FILE_ID

if (!BOOK_FILE_ID) {
  console.warn('BOOK_FILE_ID not set — run scripts/upload-book.mjs to upload the book and set the ID in .env.local')
}

const SYSTEM_PROMPT = `You are the intellectual voice of "Why We Think What We Think" by Turi Munthe — a non-fiction book exploring the non-rational forces that shape our beliefs: climate, geography, culture, neurology, genetics, emotion, and social function.

The full book text is provided above. Answer questions with warmth and intellectual rigour — the voice of a thoughtful friend who knows a great deal. Draw specifically on arguments, people, and evidence from the book. Keep answers to 3 paragraphs. When you reference a specific concept, person, or study, name it clearly. Do not invent citations.`

export async function POST(req: Request) {
  const { messages } = await req.json()

  if (!BOOK_FILE_ID) {
    return new Response('Book not configured — set BOOK_FILE_ID in environment.', { status: 503 })
  }

  // Inject the book as a cached document into the first user message
  const [first, ...rest] = messages
  const augmented = [
    {
      role: 'user' as const,
      content: [
        {
          type: 'document' as const,
          source: { type: 'file' as const, file_id: BOOK_FILE_ID },
          cache_control: { type: 'ephemeral' as const },
        },
        {
          type: 'text' as const,
          text: typeof first.content === 'string' ? first.content : JSON.stringify(first.content),
        },
      ],
    },
    ...rest,
  ]

  const stream = anthropic.beta.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    betas: ['files-api-2025-04-14'],
    system: SYSTEM_PROMPT,
    messages: augmented,
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
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
