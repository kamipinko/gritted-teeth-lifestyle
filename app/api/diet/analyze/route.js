import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const formData = await req.formData()
    const image = formData.get('image')
    const bytes = await image.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `Analyze this meal image and return a JSON object with:
- macros: { calories: "Xkcal", protein: "Xg", carbs: "Xg", fat: "Xg", fiber: "Xg" }
- micros: { vitamin_c: "Xmg", iron: "Xmg", calcium: "Xmg" } (estimate key ones)
- foods_detected: ["food1", "food2"]
- advice: "One actionable sentence about this meal"

Return only valid JSON, no markdown.`

    const result = await model.generateContent([
      prompt,
      { inlineData: { mimeType: image.type, data: base64 } },
    ])

    const text = result.response.text()
    const data = JSON.parse(text)

    return NextResponse.json(data)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
