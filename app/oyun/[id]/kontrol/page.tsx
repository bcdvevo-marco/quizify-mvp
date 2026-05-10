'use client'
import { use, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useGameChannel } from '@/lib/realtime/useGameChannel'
import { TimerBar, AnswerShape, ANS_META, Btn, Icon } from '@/components/shared'
import type { QuestionStartEvent, AnswerCountEvent } from '@/types/game'

function RingProgress({ progress, size = 100, strokeWidth = 8, color = '#6366f1' }: {
  progress: number; size?: number; strokeWidth?: number; color?: string
}) {
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - progress / 100)
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.1s linear' }}
      />
    </svg>
  )
}

export default function KontrolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [question, setQuestion] = useState<QuestionStartEvent | null>(null)
  const [answerCount, setAnswerCount] = useState<AnswerCountEvent | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [startMs, setStartMs] = useState(0)
  const [questionEnded, setQuestionEnded] = useState(false)
  const autoEndedRef = useRef(false)
  const [answerStats, setAnswerStats] = useState<{ option_id: string; count: number }[]>([])
  const [questionNum, setQuestionNum] = useState(1)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const router = useRouter()
  const { on } = useGameChannel(id)

  // Sayfa yenilenince aktif soruyu DB'den yükle
  useEffect(() => {
    fetch(`/api/oyun/${id}/soru-aktif`)
      .then(r => r.json())
      .then(data => {
        if (!data.active) return
        setQuestion({
          type: 'QUESTION_START',
          question_id: data.question_id,
          text: data.text,
          image_url: data.image_url,
          options: data.options,
          time_limit: data.time_limit,
          start_timestamp: Date.now(), // gerçek başlangıç bilinmiyor, sıfırdan sayar
          question_number: data.question_number,
          total_questions: data.total_questions,
        })
        setStartMs(Date.now())
        setTimeLeft(data.time_limit)
        setQuestionNum(data.question_number)
        setTotalQuestions(data.total_questions)
      })
      .catch(() => {})
  }, [id])

  useEffect(() => {
    const off1 = on('QUESTION_START', (e) => {
      setQuestion(e)
      setQuestionEnded(false)
      setAnswerCount(null)
      setAnswerStats([])
      setStartMs(e.start_timestamp)
      setTimeLeft(e.time_limit)
      setQuestionNum(e.question_number)
      setTotalQuestions(e.total_questions)
      autoEndedRef.current = false
    })
    const off2 = on('ANSWER_COUNT', (e) => {
      setAnswerCount(e)
    })
    const off3 = on('QUESTION_END', (e) => {
      setQuestionEnded(true)
      setAnswerStats(e.answer_stats)
    })
    const off4 = on('GAME_END', () => {
      router.push(`/oyun/${id}/sonuclar`)
    })
    return () => { off1(); off2(); off3(); off4() }
  }, [on, id, router])

  useEffect(() => {
    if (!question || questionEnded) return
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startMs) / 1000
      const left = Math.max(0, question.time_limit - elapsed)
      setTimeLeft(left)
      if (left <= 0) {
        clearInterval(interval)
        if (!autoEndedRef.current) {
          autoEndedRef.current = true
          fetch(`/api/oyun/${id}/soru-bitir`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question_id: question.question_id }),
          })
        }
      }
    }, 100)
    return () => clearInterval(interval)
  }, [question, startMs, questionEnded, id])

  async function handleEndQuestion() {
    if (!question) return
    await fetch(`/api/oyun/${id}/soru-bitir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_id: question.question_id }),
    })
    setQuestionEnded(true)
  }

  async function handleNextQuestion() {
    await fetch(`/api/oyun/${id}/soru-basla`, { method: 'POST' })
  }

  async function handleEndGame(skipConfirm = false) {
    if (!skipConfirm && !confirm('Oyunu bitirmek istiyor musun?')) return
    await fetch(`/api/oyun/${id}/bitir`, { method: 'POST' })
    router.push(`/oyun/${id}/sonuclar`)
  }

  const progress = question ? (timeLeft / question.time_limit) * 100 : 0
  const answeredPct = answerCount ? (answerCount.answered / Math.max(answerCount.total, 1)) * 100 : 0
  const sortedOptions = question ? [...question.options].sort((a, b) => a.position - b.position) : []
  const maxStat = Math.max(...answerStats.map(s => s.count), 1)

  return (
    <div className="min-h-screen flex flex-col qf-game-bg">
      {/* Header */}
      <div className="px-6 py-4 flex items-center gap-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-white/60 text-sm">Soru {questionNum}/{totalQuestions}</span>
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-400 rounded-full transition-all"
                style={{ width: `${(questionNum / Math.max(totalQuestions, 1)) * 100}%` }}
              />
            </div>
          </div>
          <TimerBar progress={progress} height={6} dark />
        </div>
        <div className="text-white/60 text-sm">
          <Icon name="users" size={16} className="inline mr-1" />
          {answerCount?.total ?? 0} oyuncu
        </div>
      </div>

      <div className="flex-1 flex gap-0">
        {/* Left: question + answers */}
        <div className="flex-1 p-8 flex flex-col gap-6">
          {question && (
            <>
              <div className="qf-glass-strong rounded-2xl p-6">
                {question.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={question.image_url} alt="" className="w-full max-h-48 object-cover rounded-xl mb-4" />
                )}
                <p className="text-white text-2xl font-bold">{question.text}</p>
              </div>

              {/* Answer bar chart */}
              <div className="space-y-3">
                {sortedOptions.map((opt, i) => {
                  const meta = ANS_META[i]
                  const stat = answerStats.find(s => s.option_id === opt.id)
                  const barPct = stat ? (stat.count / maxStat) * 100 : 0
                  return (
                    <div key={opt.id} className="flex items-center gap-3">
                      <AnswerShape kind={meta.shape} size={20} color={meta.bg} />
                      <span className="text-white/80 text-sm w-48 truncate">{opt.text}</span>
                      <div className="flex-1 h-8 bg-white/10 rounded-lg overflow-hidden">
                        <div
                          className="h-full rounded-lg flex items-center px-3 transition-all duration-500"
                          style={{ width: `${barPct}%`, background: meta.bg, minWidth: stat?.count ? 32 : 0 }}
                        >
                          {stat?.count ? (
                            <span className="text-white text-xs font-bold">{stat.count}</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 mt-auto">
                {!questionEnded ? (
                  <>
                    <Btn kind="danger" size="md" onClick={() => handleEndGame()} icon="x">
                      Oyunu Bitir
                    </Btn>
                    <Btn kind="outline" size="md" onClick={handleEndQuestion} icon="check">
                      Soruyu Bitir
                    </Btn>
                  </>
                ) : questionNum === totalQuestions ? (
                  <Btn kind="success" size="lg" full onClick={() => handleEndGame(true)} icon="trophy">
                    Oyunu Bitir &amp; Sonuçları Gör
                  </Btn>
                ) : (
                  <Btn kind="primary" size="md" onClick={handleNextQuestion} iconRight="arrow-r">
                    Sonraki Soru
                  </Btn>
                )}
              </div>
            </>
          )}

          {!question && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-white/40 animate-pulse">Soru bekleniyor...</p>
            </div>
          )}
        </div>

        {/* Right: stats */}
        <div className="w-72 p-8 flex flex-col items-center gap-8" style={{ borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
          {/* Timer ring */}
          <div className="relative">
            <RingProgress
              progress={progress}
              size={120}
              strokeWidth={10}
              color={progress < 25 ? '#ef4444' : progress < 50 ? '#f59e0b' : '#10b981'}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white text-2xl font-black">{Math.ceil(timeLeft)}</span>
            </div>
          </div>

          {/* Answered count */}
          <div className="text-center">
            <div className="relative mb-2">
              <RingProgress progress={answeredPct} size={80} strokeWidth={7} color="#6366f1" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-sm font-black">{answerCount?.answered ?? 0}</span>
              </div>
            </div>
            <p className="text-white/60 text-xs">cevap verdi</p>
          </div>

          {/* Stats */}
          <div className="w-full space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Toplam oyuncu</span>
              <span className="text-white font-bold">{answerCount?.total ?? 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Cevaplayan</span>
              <span className="text-white font-bold">{answerCount?.answered ?? 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Bekleyen</span>
              <span className="text-white font-bold">{(answerCount?.total ?? 0) - (answerCount?.answered ?? 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
