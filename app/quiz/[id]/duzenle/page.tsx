'use client'
import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Icon, Btn, AnswerShape, ANS_META, useToast } from '@/components/shared'
import { ImageUploader } from '@/components/host/ImageUploader'

interface Option { id?: string; text: string; is_correct: boolean; position: number }
interface Question {
  id?: string
  text: string
  image_url: string | null
  time_limit: number
  position: number
  options: Option[]
}

const BLANK_QUESTION = (): Question => ({
  text: '',
  image_url: null,
  time_limit: 20,
  position: 0,
  options: [
    { text: '', is_correct: true,  position: 0 },
    { text: '', is_correct: false, position: 1 },
    { text: '', is_correct: false, position: 2 },
    { text: '', is_correct: false, position: 3 },
  ],
})

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [title, setTitle] = useState('')
  const [questions, setQuestions] = useState<Question[]>([BLANK_QUESTION()])
  const [activeIdx, setActiveIdx] = useState(0)
  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiTopic, setAiTopic] = useState('')
  const [showAI, setShowAI] = useState(false)
  const router = useRouter()
  const toast = useToast()

  useEffect(() => {
    if (id === 'yeni') return
    fetch(`/api/quiz/${id}`)
      .then(r => r.json())
      .then(data => {
        setTitle(data.title)
        if (data.questions?.length) {
          setQuestions(data.questions.map((q: any) => ({
            ...q,
            options: q.options.sort((a: any, b: any) => a.position - b.position),
          })))
        }
      })
  }, [id])

  function updateQuestion(idx: number, updates: Partial<Question>) {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, ...updates } : q))
  }

  function updateOption(qIdx: number, optIdx: number, text: string) {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q
      return { ...q, options: q.options.map((o, j) => j === optIdx ? { ...o, text } : o) }
    }))
  }

  function setCorrect(qIdx: number, optIdx: number) {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q
      return { ...q, options: q.options.map((o, j) => ({ ...o, is_correct: j === optIdx })) }
    }))
  }

  function addQuestion() {
    const newQ: Question = { ...BLANK_QUESTION(), position: questions.length }
    setQuestions(prev => [...prev, newQ])
    setActiveIdx(questions.length)
  }

  function removeQuestion(idx: number) {
    if (questions.length <= 1) return
    setQuestions(prev => prev.filter((_, i) => i !== idx))
    setActiveIdx(Math.max(0, idx - 1))
  }

  async function handleSave() {
    if (!title.trim()) { toast.show('Quiz başlığı gerekli', 'error'); return }
    setSaving(true)

    const method = id === 'yeni' ? 'POST' : 'PUT'
    const url = id === 'yeni' ? '/api/quiz' : `/api/quiz/${id}`
    const body = id === 'yeni'
      ? { title, questions: questions.map((q, i) => ({ ...q, position: i })) }
      : { title, questions: questions.map((q, i) => ({ ...q, position: i })) }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      toast.show('Quiz kaydedildi', 'success')
      router.push('/dashboard')
    } else {
      const data = await res.json().catch(() => ({}))
      toast.show(data.error ?? 'Kaydetme hatası', 'error')
    }
    setSaving(false)
  }

  async function handleAIGenerate() {
    if (!aiTopic.trim()) return
    setAiLoading(true)
    const res = await fetch('/api/quiz/ai-uret', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: aiTopic, count: 5 }),
    })
    const { questions: generated } = await res.json()
    const newQuestions: Question[] = generated.map((q: any, i: number) => ({
      text: q.text,
      image_url: null,
      time_limit: 20,
      position: questions.length + i,
      options: q.options.map((o: any, j: number) => ({ text: o.text, is_correct: o.is_correct, position: j })),
    }))
    setQuestions(prev => [...prev, ...newQuestions])
    setActiveIdx(questions.length)
    setShowAI(false)
    setAiLoading(false)
  }

  const activeQ = questions[activeIdx]

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Top bar */}
      <div className="flex items-center gap-4 px-6 py-4 bg-white border-b border-slate-200">
        <button onClick={() => router.push('/dashboard')} className="text-slate-400 hover:text-slate-700 transition-colors">
          <Icon name="arrow-l" size={20} />
        </button>
        <input
          type="text"
          placeholder="Quiz başlığı..."
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="flex-1 text-xl font-black text-slate-900 placeholder-slate-300 focus:outline-none bg-transparent"
        />
        <div className="flex items-center gap-2">
          <Btn kind="ghost" size="sm" icon="sparkle" onClick={() => setShowAI(true)}>
            AI ile Üret
          </Btn>
          <Btn kind="primary" size="sm" loading={saving} onClick={handleSave}>
            Kaydet
          </Btn>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Question list sidebar */}
        <aside className="w-72 flex-none bg-white border-r border-slate-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-500">Sorular ({questions.length})</span>
            <button
              onClick={addQuestion}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
            >
              <Icon name="plus" size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto qf-scroll p-3 space-y-2">
            {questions.map((q, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className="w-full flex items-start gap-3 px-3 py-3 rounded-xl text-left transition-all"
                style={{
                  background: activeIdx === i ? '#eef2ff' : 'transparent',
                  border: activeIdx === i ? '1.5px solid #c7d2fe' : '1.5px solid transparent',
                }}
              >
                <span className="text-xs font-black text-slate-400 mt-0.5 w-4 shrink-0">{i + 1}</span>
                <span className="flex-1 text-sm text-slate-700 font-medium line-clamp-2">
                  {q.text || 'Soru metni...'}
                </span>
                <button
                  onClick={e => { e.stopPropagation(); removeQuestion(i) }}
                  className="shrink-0 text-slate-300 hover:text-red-400 transition-colors"
                >
                  <Icon name="x" size={14} />
                </button>
              </button>
            ))}
          </div>
        </aside>

        {/* Editor main */}
        {activeQ && (
          <main className="flex-1 overflow-y-auto qf-scroll p-8">
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Question text */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Soru</label>
                <textarea
                  placeholder="Soru metnini buraya yaz..."
                  value={activeQ.text}
                  onChange={e => updateQuestion(activeIdx, { text: e.target.value })}
                  rows={3}
                  className="w-full border-2 border-slate-200 rounded-2xl px-5 py-4 text-lg font-semibold text-slate-800 placeholder-slate-300 focus:outline-none focus:border-indigo-400 transition-colors resize-none"
                />
              </div>

              {/* Image upload */}
              <ImageUploader
                value={activeQ.image_url}
                onChange={url =>
                  setQuestions(prev =>
                    prev.map((q, i) => i === activeIdx ? { ...q, image_url: url } : q)
                  )
                }
              />

              {/* Options */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">Şıklar</label>
                <div className="grid grid-cols-2 gap-3">
                  {activeQ.options.map((opt, j) => {
                    const meta = ANS_META[j]
                    return (
                      <div
                        key={j}
                        className="rounded-xl p-3 flex items-center gap-2"
                        style={{
                          background: opt.is_correct ? '#f0fdf4' : '#f8fafc',
                          border: `2px solid ${opt.is_correct ? '#86efac' : '#e2e8f0'}`,
                        }}
                      >
                        <button
                          onClick={() => setCorrect(activeIdx, j)}
                          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                          style={{ background: opt.is_correct ? meta.bg : 'transparent', border: `2px solid ${opt.is_correct ? meta.bg : '#cbd5e1'}` }}
                          title="Doğru şık olarak işaretle"
                        >
                          <AnswerShape kind={meta.shape} size={14} color={opt.is_correct ? 'white' : '#94a3b8'} />
                        </button>
                        <input
                          type="text"
                          placeholder={`${meta.key} şıkkı...`}
                          value={opt.text}
                          onChange={e => updateOption(activeIdx, j, e.target.value)}
                          className="flex-1 bg-transparent text-sm font-semibold text-slate-700 placeholder-slate-300 focus:outline-none"
                        />
                        {opt.is_correct && (
                          <span className="text-green-600 text-xs font-bold">✓ Doğru</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Settings */}
              <div className="flex items-center gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Süre (sn)</label>
                  <select
                    value={activeQ.time_limit}
                    onChange={e => updateQuestion(activeIdx, { time_limit: Number(e.target.value) })}
                    className="border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:border-indigo-400"
                  >
                    {[10, 20, 30, 60, 90].map(t => (
                      <option key={t} value={t}>{t} sn</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </main>
        )}
      </div>

      {/* AI Modal */}
      {showAI && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-slate-900">✨ AI ile Soru Üret</h2>
              <button onClick={() => setShowAI(false)} className="text-slate-400 hover:text-slate-600">
                <Icon name="x" size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Konu: örn. Osmanlı Tarihi, Python programlama..."
                value={aiTopic}
                onChange={e => setAiTopic(e.target.value)}
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-400"
                onKeyDown={e => e.key === 'Enter' && handleAIGenerate()}
              />
              <Btn kind="primary" size="lg" full icon="sparkle" loading={aiLoading} onClick={handleAIGenerate}>
                {aiLoading ? 'Üretiliyor...' : '5 Soru Üret'}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
