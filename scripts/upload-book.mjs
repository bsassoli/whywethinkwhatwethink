#!/usr/bin/env node
// Run once from the site/ directory to upload the book to Anthropic's Files API.
// The returned file ID never expires and stays on Anthropic's servers — the text
// never needs to be in your repo or deployment.
//
// Usage:
//   ANTHROPIC_API_KEY=sk-... node scripts/upload-book.mjs
//
// Then add the printed ID to .env.local and to your Vercel environment variables.

import Anthropic from '@anthropic-ai/sdk'
import { readFileSync, readdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const textDir = resolve(__dir, '../../text')

const client = new Anthropic()

const files = readdirSync(textDir).filter(f => f.endsWith('.md')).sort()
const content = files.map(f => readFileSync(resolve(textDir, f), 'utf-8')).join('\n\n---\n\n')

console.log(`Uploading ${files.length} chapters (${(content.length / 1024).toFixed(0)} KB)...`)

const uploaded = await client.beta.files.upload(
  { file: new File([content], 'book.md', { type: 'text/plain' }) },
  { headers: { 'anthropic-beta': 'files-api-2025-04-14' } }
)

console.log(`\nDone. Add this to .env.local and to Vercel environment variables:\n\nBOOK_FILE_ID=${uploaded.id}`)
