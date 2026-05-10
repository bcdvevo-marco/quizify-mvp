import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8"
      style={{ background: 'linear-gradient(140deg, #1e1b4b 0%, #0f0c29 100%)' }}>
      <div
        className="text-9xl font-black"
        style={{ background: 'linear-gradient(135deg, #a5b4fc, #c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
      >
        404
      </div>
      <div className="text-center">
        <h1 className="text-white text-2xl font-black mb-2">Sayfa bulunamadı</h1>
        <p className="text-white/50 text-sm">Aradığın sayfa taşınmış veya silinmiş olabilir.</p>
      </div>
      <Link
        href="/"
        className="px-6 py-3 rounded-2xl font-bold text-indigo-700 transition-all active:scale-95"
        style={{ background: 'white' }}
      >
        Ana Sayfaya Dön
      </Link>
    </div>
  )
}
