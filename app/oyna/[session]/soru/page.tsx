'use client'
import { use, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useGameChannel } from '@/lib/realtime/useGameChannel'
import { TimerBar, AnswerShape, ANS_META } from '@/components/shared'
import type { QuestionStartEvent } from '@/types/game'

export default function QuestionPage({ params }: { params: Promise<{ session: string }> }) {
  const { session } = use(params)
  const [question, setQuestion] = useState<QuestionStartEvent | null>(null)
  const [answered, setAnswered] = useState(false)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [startMs, setStartMs] = useState(0)
  const [correctOptionId, setCorrectOptionId] = useState<string | null>(null)
  const [earnedPoints, setEarnedPoints] = useState<number | null>(null)
  const [showFloatUp, setShowFloatUp] = useState(false)
  const router = useRouter()
  const { on } = useGameChannel(session)

  useEffect(() => {
    const off1 = on('QUESTION_START', (e) => {
      setQuestion(e)
      setAnswered(false)
      setSelectedOption(null)
      setCorrectOptionId(null)
      setEarnedPoints(null)
      setShowFloatUp(false)
      setStartMs(e.start_timestamp)
      setTimeLeft(e.time_limit)
    })
    const off2 = on('QUESTION_END', (e) => {
      setCorrectOptionId(e.correct_option_id)
      if (e.your_points !== undefined) {
        setEarnedPoints(e.your_points)
        setShowFloatUp(true)
        setTimeout(() => setShowFloatUp(false), 1400)
      }
    })
    const off3 = on('LEADERBOARD_UPDATE', () => {
      router.push(`/oyna/${session}/skor`)
    })
    const off4 = on('GAME_END', () => {
      router.push(`/oyna/${session}/bitis`)
    })
    return () => { off1(); off2(); off3(); off4() }
  }, [on, session, router])

  useEffect(() => {
    if (!question || answered) return
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startMs) / 1000
      const left = Math.max(0, question.time_limit - elapsed)
      setTimeLeft(left)
      if (left <= 0) clearInterval(interval)
    }, 100)
    return () => clearInterval(interval)
  }, [question, startMs, answered])

  const handleAnswer = useCallback(async (optionId: string) => {
    if (answered || !question) return
    setAnswered(true)
    setSelectedOption(optionId)
    const answeredMs = Date.now() - startMs
    const playerId = sessionStorage.getItem('player_id')
    await fetch(`/api/oyun/${session}/cevap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id: playerId, question_id: question.question_id, option_id: optionId, answered_ms: answeredMs }),
    })
  }, [answered, question, startMs, session])

  if (!question) {
    return (
      <div className="min-h-screen qf-game-bg flex items-center justify-center">
        <p className="text-white/60 text-lg animate-pulse">Soru bekleniyor...</p>
      </div>
    )
  }

  const progress = (timeLeft / question.time_limit) * 100
  const sortedOptions = [...question.options].sort((a, b) => a.position - b.position)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0f0c29' }}>
      {/* Timer bar */}
      <TimerBar progress={progress} height={6} dark />

      <div className="flex-1 flex flex-col p-4 gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-white/50 text-sm">{question.question_number}/{question.total_questions}</span>
          <span
            className="text-2xl font-black"
            style={{
              background: 'linear-gradient(135deg, #a5b4fc, #c4b5fd)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {Math.ceil(timeLeft)}
          </span>
        </div>

        {/* Question card */}
        <div className="qf-glass-strong rounded-2xl p-5">
          {question.image_url && (
            <img src={question.image_url} alt="" className="w-full max-h-36 object-cover rounded-xl mb-3" />
          )}
          <p className="text-white text-lg font-semibold text-center leading-snug">{question.text}</p>
        </div>

        {/* Float-up points */}
        {showFloatUp && earnedPoints !== null && earnedPoints > 0 && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ zIndex: 50 }}
          >
            <div
              className="qf-float-up text-4xl font-black text-white"
              style={{ textShadow: '0 0 20px rgba(99,102,241,0.8)' }}
            >
              +{earnedPoints}
            </div>
          </div>
        )}

        {/* Answer buttons */}
        <div className="grid grid-cols-2 gap-3 mt-auto">
          {sortedOptions.map((opt, i) => {
            const meta = ANS_META[i]
            const isSelected = selectedOption === opt.id
            const isCorrect = correctOptionId === opt.id
            const isWrong = answered && isSelected && !isCorrect
            const isDim = answered && !isCorrect && !isSelected

            return (
              <button
                key={opt.id}
                onClick={() => handleAnswer(opt.id)}
                disabled={answered}
                className="rounded-2xl p-4 min-h-20 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 disabled:cursor-default"
                style={{
                  background: `linear-gradient(160deg, ${meta.bg} 0%, ${meta.bgDk} 100%)`,
                  opacity: isWrong || isDim ? 0.4 : 1,
                  outline: isCorrect ? '3px solid white' : isSelected && !isCorrect ? '3px solid rgba(255,255,255,0.5)' : 'none',
                  outlineOffset: 2,
                  boxShadow: isCorrect ? `0 0 24px ${meta.bg}80` : undefined,
                }}
              >
                <AnswerShape kind={meta.shape} size={22} color="rgba(255,255,255,0.8)" />
                <span className="text-white text-sm font-semibold text-center leading-tight">{opt.text}</span>
              </button>
            )
          })}
        </div>

        {/* Answer status */}
        {answered && (
          <div className="text-center">
            {correctOptionId && selectedOption === correctOptionId ? (
              <p className="text-green-400 font-bold text-lg">✓ Doğru!</p>
            ) : correctOptionId ? (
              <p className="text-red-400 font-bold text-lg">✗ Yanlış</p>
            ) : (
              <p className="text-white/50 text-sm animate-pulse">Sonuç bekleniyor...</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
