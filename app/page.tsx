import Link from 'next/link'
import { QuizifyLockup } from '@/components/shared'

export default function LandingPage() {
  return (
    <div className="min-h-screen qf-meshbg flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5">
        <QuizifyLockup size={36} />
        <div className="flex items-center gap-3">
          <Link
            href="/katil"
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            Oyuna Katıl
          </Link>
          <Link
            href="/giris"
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)', boxShadow: '0 4px 14px rgba(99,102,241,.35)' }}
          >
            Host Girişi
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-8">
        <div>
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6"
            style={{ background: 'rgba(99,102,241,0.12)', color: '#4f46e5', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            ✨ Gerçek zamanlı quiz platformu
          </div>
          <h1 className="text-6xl font-black tracking-tight leading-none mb-4 max-w-2xl text-slate-900">
            Quizify ile{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              eğlenceli öğren
            </span>
          </h1>
          <p className="text-lg text-slate-500 max-w-md mx-auto">
            Quiz oluştur, oyuncuları PIN ile davet et, canlı skor takibi yap.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/giris"
            className="px-8 py-4 rounded-2xl text-lg font-black text-white hover:brightness-110 transition-all"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)', boxShadow: '0 8px 28px rgba(99,102,241,.4)' }}
          >
            Quiz Oluştur →
          </Link>
          <Link
            href="/katil"
            className="px-8 py-4 rounded-2xl text-lg font-bold text-slate-600 bg-white border-2 border-slate-200 hover:bg-slate-50 transition-all"
          >
            Oyuna Katıl
          </Link>
        </div>

        <div className="flex items-center gap-8 text-center mt-4">
          {[['10K+', 'Quiz'], ['500K+', 'Oyuncu'], ['99.9%', 'Uptime']].map(([val, label]) => (
            <div key={label}>
              <p className="text-2xl font-black text-indigo-600">{val}</p>
              <p className="text-sm text-slate-400">{label}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
