import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

async function getYouTubeVideoId(exerciseName) {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return null
  try {
    const query = encodeURIComponent(`${exerciseName} exercise tutorial proper form`)
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&maxResults=1&key=${apiKey}`
    )
    const data = await res.json()
    return data.items?.[0]?.id?.videoId || null
  } catch {
    return null
  }
}

export async function POST(req) {
  try {
    const { goal, daysPerWeek, weeks, equipment } = await req.json()

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `Create a ${weeks}-week workout program for someone whose goal is "${goal}".
They can train ${daysPerWeek} days per week. Equipment: ${equipment || 'bodyweight only'}.

Return a JSON object with this structure:
{
  "weeks": [
    {
      "days": [
        {
          "name": "Day 1 - Push",
          "exercises": [
            { "name": "Bench Press", "sets": 4, "reps": "8-10" },
            { "name": "Overhead Press", "sets": 3, "reps": "10-12" }
          ]
        }
      ]
    }
  ]
}

Rules:
- Only include ${daysPerWeek} training days per week (rest days are implicit)
- Progress the difficulty week over week (increase sets or reps)
- Use real exercise names suitable for YouTube search
- Return only valid JSON, no markdown`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const plan = JSON.parse(text)

    // Fetch YouTube IDs for each unique exercise
    const exerciseNames = new Set()
    plan.weeks.forEach(week =>
      week.days.forEach(day =>
        day.exercises.forEach(ex => exerciseNames.add(ex.name))
      )
    )

    const videoMap = {}
    await Promise.all(
      [...exerciseNames].map(async name => {
        videoMap[name] = await getYouTubeVideoId(name)
      })
    )

    // Attach video IDs
    plan.weeks.forEach(week =>
      week.days.forEach(day =>
        day.exercises.forEach(ex => {
          ex.youtubeId = videoMap[ex.name] || null
        })
      )
    )

    return NextResponse.json(plan)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Plan generation failed' }, { status: 500 })
  }
}
