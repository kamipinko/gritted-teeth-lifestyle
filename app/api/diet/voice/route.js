import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const { audio, mimeType } = await req.json()

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `Listen to this audio recording of someone describing what they ate and return a JSON object with:
- transcript: the spoken text
- foods_detected: array of food items mentioned
- macros: { calories, protein, carbs, fat, fiber } — all numbers, no units
- micros: { vitamin_c, iron, calcium } — all numbers in mg, no units
- advice: one actionable sentence about this meal

Return only valid JSON, no markdown, no code blocks.`

    const result = await model.generateContent([
      prompt,
      { inlineData: { mimeType: mimeType || 'audio/webm', data: audio } },
    ])

    const text = result.response.text().replace(/```json|```/g, '').trim()
    const data = JSON.parse(text)

    return NextResponse.json(data)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Voice analysis failed' }, { status: 500 })
  }
}
