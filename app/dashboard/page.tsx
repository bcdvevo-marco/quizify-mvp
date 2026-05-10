'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { QuizifyLockup, Icon, Btn, Avatar, useToast } from '@/components/shared'
import Link from 'next/link'

interface Quiz {
  id: string
  title: string
  status: 'draft' | 'published'
  created_at: string
  questions: { count: number }[]
}

interface User {
  id: string
  email: string
  name: string
}

const FILTER_LABELS = ['Tümü', 'Taslak', 'Yayınlandı']

export default function DashboardPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [filter, setFilter] = useState('Tümü')
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const toast = useToast()

  useEffect(() => {
    async function load() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { router.push('/giris'); return }

      const { data: userData } = await supabase
        .from('users')
        .select('id, email, name')
        .eq('id', authUser.id)
        .single()

      setUser(userData as unknown as User)

      const res = await fetch('/api/quiz')
      const data = await res.json()
      setQuizzes(Array.isArray(data) ? data : [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleDelete(id: string) {
    if (!confirm('Bu quizi silmek istediğine emin misin?')) return
    await fetch(`/api/quiz/${id}`, { method: 'DELETE' })
    setQuizzes(prev => prev.filter(q => q.id !== id))
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  async function handleStartGame(quizId: string) {
    const res = await fetch('/api/oyun', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quiz_id: quizId }),
    })
    const data = await res.json()
    if (!res.ok) { toast.show(data.error ?? 'Oyun başlatılamadı', 'error'); return }
    router.push(`/oyun/${data.id}/lobi`)
  }

  async function handleTogglePublish(quiz: Quiz) {
    const newStatus = quiz.status === 'published' ? 'draft' : 'published'
    const res = await fetch(`/api/quiz/${quiz.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (!res.ok) { toast.show('Durum güncellenemedi', 'error'); return }
    setQuizzes(prev => prev.map(q => q.id === quiz.id ? { ...q, status: newStatus } : q))
    toast.show(newStatus === 'published' ? 'Quiz yayına alındı' : 'Taslağa çekildi', 'success')
  }

  const filtered = quizzes.filter(q => {
    if (filter === 'Taslak') return q.status === 'draft'
    if (filter === 'Yayınlandı') return q.status === 'published'
    return true
  })

  const stats = [
    { label: 'Toplam Quiz', value: quizzes.length },
    { label: 'Yayınlandı', value: quizzes.filter(q => q.status === 'published').length },
    { label: 'Taslak', value: quizzes.filter(q => q.status === 'draft').length },
    { label: 'Sorular', value: quizzes.reduce((s, q) => s + (q.questions?.[0]?.count ?? 0), 0) },
  ]

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-60 flex-none flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
        style={{
          background: 'white',
          borderRight: '1px solid var(--slate-200)',
          transition: 'transform 0.25s ease',
        }}
      >
        <div className="px-5 py-6">
          <QuizifyLockup size={32} />
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {[
            { icon: 'chart-bar' as const, label: 'Dashboard', href: '/dashboard', active: true },
            { icon: 'users' as const, label: 'Oyunlarım', href: '/dashboard', active: false },
            { icon: 'settings' as const, label: 'Ayarlar', href: '/dashboard', active: false },
          ].map(item => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              style={{
                background: item.active ? 'var(--indigo-50)' : 'transparent',
                color: item.active ? 'var(--indigo-700)' : 'var(--slate-500)',
              }}
            >
              <Icon name={item.icon} size={18} />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Pro card */}
        <div
          className="mx-3 mb-4 rounded-2xl p-4"
          style={{ background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)' }}
        >
          <p className="text-white text-sm font-bold mb-1">Pro'ya Geç</p>
          <p className="text-white/70 text-xs mb-3">Sınırsız quiz, AI sorular</p>
          <button className="w-full bg-white text-indigo-700 rounded-xl py-2 text-xs font-bold">Yükselt</button>
        </div>

        {/* User */}
        {user && (
          <div className="px-3 pb-4 flex items-center gap-3">
            <Avatar name={user.name || user.email} size={36} />
            <div className="flex-1 min-w-0">
              <p className="text-slate-800 text-sm font-semibold truncate">{user.name}</p>
              <p className="text-slate-400 text-xs truncate">{user.email}</p>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-slate-600 transition-colors">
              <Icon name="logout" size={16} />
            </button>
          </div>
        )}
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 lg:px-8 py-4 lg:py-6 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(o => !o)}
              aria-label="Menüyü aç"
            >
              <Icon name="menu" size={20} />
            </button>
            <div>
              <h1 className="text-xl lg:text-2xl font-black text-slate-900">Quizlerim</h1>
              <p className="text-slate-500 text-sm">{quizzes.length} quiz</p>
            </div>
          </div>
          <Btn icon="plus" size="md" onClick={() => router.push('/quiz/yeni')}>
            <span className="hidden sm:inline">Yeni Quiz</span>
            <span className="sm:hidden">Yeni</span>
          </Btn>
        </div>

        <div className="flex-1 p-4 lg:p-8">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6 lg:mb-8">
            {stats.map(s => (
              <div key={s.label} className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <p className="text-2xl font-black text-slate-900">{s.value}</p>
                <p className="text-slate-500 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-2 mb-6">
            {FILTER_LABELS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                style={{
                  background: filter === f ? '#6366f1' : 'white',
                  color: filter === f ? 'white' : '#64748b',
                  border: filter === f ? 'none' : '1px solid #e2e8f0',
                }}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Quiz grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="qf-skeleton h-44 rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-400 text-lg mb-4">Henüz quiz yok</p>
              <Btn icon="plus" onClick={() => router.push('/quiz/yeni')}>
                İlk Quizini Oluştur
              </Btn>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(quiz => (
                <div
                  key={quiz.id}
                  className="bg-white rounded-2xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
                  style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                >
                  {/* Quiz cover placeholder */}
                  <div
                    className="w-full h-28 rounded-xl flex items-center justify-center text-4xl"
                    style={{ background: 'linear-gradient(135deg, var(--indigo-50), var(--indigo-100))' }}
                  >
                    🧩
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 truncate">{quiz.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-slate-400 text-xs">{quiz.questions?.[0]?.count ?? 0} soru</span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{
                          background: quiz.status === 'published' ? '#d1fae5' : '#f1f5f9',
                          color: quiz.status === 'published' ? '#047857' : '#64748b',
                        }}
                      >
                        {quiz.status === 'published' ? 'Yayında' : 'Taslak'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Btn kind="primary" size="sm" icon="play" full onClick={() => handleStartGame(quiz.id)}>
                      Başlat
                    </Btn>
                    <button
                      onClick={() => handleTogglePublish(quiz)}
                      title={quiz.status === 'published' ? 'Taslağa çek' : 'Yayınla'}
                      className="p-2 rounded-xl transition-colors"
                      style={{
                        color: quiz.status === 'published' ? '#047857' : '#94a3b8',
                        background: quiz.status === 'published' ? '#d1fae5' : 'transparent',
                      }}
                    >
                      <Icon name={quiz.status === 'published' ? 'eye' : 'eye-off'} size={16} />
                    </button>
                    <button
                      onClick={() => router.push(`/quiz/${quiz.id}/duzenle`)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <Icon name="edit" size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(quiz.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
