'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function DietPage() {
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)

  function handleImageChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setImage(file)
    setPreview(URL.createObjectURL(file))
    setAnalysis(null)
  }

  async function analyzeImage() {
    if (!image) return
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('image', image)
      const res = await fetch('/api/diet/analyze', { method: 'POST', body: formData })
      const data = await res.json()
      setAnalysis(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen px-6 py-10 max-w-2xl mx-auto">
      <Link href="/" className="text-brand-muted text-sm hover:text-white mb-8 block">← Back</Link>

      <h1 className="text-3xl font-black mb-1">Nutrition Tracker</h1>
      <p className="text-brand-muted text-sm mb-10">Snap a photo of your meal to log macros & micros</p>

      {/* Image Upload */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-6 mb-6">
        <label className="block mb-4 text-sm font-semibold">Upload or take a photo</label>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageChange}
          className="block w-full text-sm text-brand-muted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-accent file:text-white file:font-semibold cursor-pointer"
        />
        {preview && (
          <img src={preview} alt="Meal preview" className="mt-4 rounded-xl w-full max-h-64 object-cover" />
        )}
        {preview && (
          <button
            onClick={analyzeImage}
            disabled={loading}
            className="mt-4 w-full bg-brand-accent hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Analyze Meal'}
          </button>
        )}
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="bg-brand-card border border-brand-border rounded-2xl p-6 mb-6">
          <h2 className="font-bold text-lg mb-4">Nutritional Breakdown</h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {analysis.macros && Object.entries(analysis.macros).map(([key, val]) => (
              <div key={key} className="bg-brand-dark rounded-xl p-4">
                <div className="text-brand-muted text-xs uppercase tracking-wide mb-1">{key}</div>
                <div className="text-xl font-bold">{val}</div>
              </div>
            ))}
          </div>
          {analysis.advice && (
            <div>
              <h3 className="font-semibold text-sm mb-2 text-brand-gold">Advice</h3>
              <p className="text-brand-muted text-sm leading-relaxed">{analysis.advice}</p>
            </div>
          )}
        </div>
      )}

      {/* Weekly Report placeholder */}
      <div className="bg-brand-card border border-dashed border-brand-border rounded-2xl p-6 text-center">
        <p className="text-brand-muted text-sm">Weekly report will appear here after 7 days of logging</p>
      </div>
    </main>
  )
}
