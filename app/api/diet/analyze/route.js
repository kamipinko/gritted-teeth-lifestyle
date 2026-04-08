import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const formData = await req.formData()
    const image = formData.get('image')
    const bytes = await image.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const result = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 16000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: image.type, data: base64 },
            },
            {
              type: 'text',
              text: `Analyze this meal image and return a JSON object with:
- macros: { calories: "Xkcal", protein: "Xg", carbs: "Xg", fat: "Xg", fiber: "Xg" }
- micros: { vitamin_c: "Xmg", iron: "Xmg", calcium: "Xmg" } (estimate key ones)
- foods_detected: ["food1", "food2"]
- advice: "One actionable sentence about this meal"

Return only valid JSON, no markdown.`,
            },
          ],
        },
      ],
    })

    const text = result.content[0].text
    const data = JSON.parse(text)

    return NextResponse.json(data)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
